import JobModel, { IJob, JobData } from "../models/Job";
import AssessmentResult, {
  EvaluatorType,
  IAssessmentResult,
  IAssessmentResultPage,
} from "../models/AssessmentResult";
import { ErrorWithCode } from "../utils/error";
import { mainQueue } from "../queue/QueueManager";
import { JobType } from "../queue/initializeMainWorker";
import Assessment, { AssessmentType, IAssessment } from "../models/Assessment";
import { ILikertQuestion, IMultiChoiceQuestion, IQuestion, IQuizItem, QuestionModel, QuizItemType } from "../models/QuizItem";
import { shuffleArray } from "../utils/array";
import Quiz, { IQuiz, RewardType } from "../models/Quiz";
import mongoose, { AggregateOptions, AnyBulkWriteOperation, ClientSession, FilterQuery, PopulateOptions, Types } from "mongoose";
import { AssessmentService } from "./AssessmentService";
import Student from "../models/Student";
import assert from 'node:assert';
import { ASSESSMENT_SUBMISSION_GRACE_PERIOD_IN_MINUTES, MS_PER_MINUTE } from "../utils/constants";
import { createNewNotification } from "./NotificationService";
import { BulkWriteResult } from 'mongodb';
import User from "../models/User";

namespace AssessmentResultService {
  export const TIME_OFFSET_MS = 5000; // include estimated delay when response is received and interpreted by student's browser taking consideration of network latency and possible slow server response time.
  export const TIME_OFFSET_SHORT_MS = 1000;
  export const setClockAndTimeLeft = (assessmentResult: IAssessmentResult) => {
    let timeLeft = 0;
    const assessment = assessmentResult.assessment as IAssessment;
    assessmentResult.serverClock = new Date(Date.now() + TIME_OFFSET_MS);
    if (assessmentResult.endedAt) {
      (assessmentResult as any)['timeLeft'] = 0;
      return;
    }
    const isDurationValid = !isNaN(assessment.duration as number) && assessment.duration as number >= 1;
    if (assessmentResult.startedAt && isDurationValid) {
      (assessmentResult as any)['timeLeft'] = Math.max(0, (assessmentResult.startedAt.getTime() + (assessment.duration! * 60 * 1000)) - Date.now() - TIME_OFFSET_SHORT_MS);
      return;
    }

    if (assessment.start_at && (assessment.ended_at || isDurationValid)) {
      if (assessment.ended_at && isDurationValid) {
        timeLeft = Math.min(assessment.ended_at.getTime() - Date.now(), Date.now() + assessment.duration! * 60 * 1000);
      } else if (assessment.ended_at) {
        timeLeft = assessment.ended_at.getTime() - Date.now();
      } else {
        timeLeft = assessment.duration! * 60 * 1000;
      }
      timeLeft = Math.max(0, timeLeft - TIME_OFFSET_SHORT_MS);
      (assessmentResult as any)['timeLeft'] = timeLeft;
    }
  }

  export const getExpectedEndDateTime = (assessmentResult: IAssessmentResult, expectedEndDateTime?: Date) => {
    const result: {
      expectedEndDateTime?: Date, // exists if assessment result should have ended at this time
      ended?: boolean, // exists if assessment (not result) is ended
      exceeded?: boolean // exists if assessment results have started and exceeded assessment's duration
    } = {};
    if (assessmentResult.endedAt) {
      return result;
    }

    if ((assessmentResult.assessment as IAssessment).ended_at.getTime() < (Date.now() - ASSESSMENT_SUBMISSION_GRACE_PERIOD_IN_MINUTES * MS_PER_MINUTE)) {
      result.expectedEndDateTime = (assessmentResult.assessment as IAssessment).ended_at;
      result.ended = true;
    }
    if (assessmentResult.startedAt && (assessmentResult.assessment as IAssessment).duration) {
      const latestEndDateTime = assessmentResult.startedAt.getTime() + (assessmentResult.assessment as IAssessment).duration! * MS_PER_MINUTE;
      if (Date.now() > (latestEndDateTime + ASSESSMENT_SUBMISSION_GRACE_PERIOD_IN_MINUTES * MS_PER_MINUTE)) {
        if (result.expectedEndDateTime) {
          result.expectedEndDateTime = new Date(Math.min(result.expectedEndDateTime.getTime(), latestEndDateTime));
        } else {
          result.expectedEndDateTime = new Date(latestEndDateTime);
        }
        result.exceeded = true;
      }
    }
    return result;
  };

  export const endAssessmentResults = async () => {
    const now = new Date();
    // get all assessments that have ended in the past week
    const assessments = await Assessment.aggregate([
      {
        $match: { start_at: { $lt: now }, endedAndMarked: false }
      },
      { $project: { _id: 1, duration: 1, ended_at: 1 } }
    ]);

    const assessmentEndedIds = [];
    const assessmentInProgressIds = [];
    for (const assessment of assessments) {
      if (assessment.ended_at <= now) {
        assessmentEndedIds.push(assessment._id);
      } else if (assessment.duration && assessment.duration >= 1) {
        assessmentInProgressIds.push(assessment._id);
      }
    }

    const assessmentResults: IAssessmentResult[] = await AssessmentResult.aggregate([
      {
        $match: {
          $or: [
            { assessment: { $in: assessmentEndedIds }, $or: [{ endedAt: { $exists: false } }, { totalRewards: { $exists: false } }] },
            { assessment: { $in: assessmentInProgressIds }, startedAt: { $exists: true }, $or: [{ endedAt: { $exists: false } }, { totalRewards: { $exists: false } }] }
          ]
        }
      },
      { $project: { assessment: 1, startedAt: 1, endedAt: 1 } }
    ]);

    const bulkWrites: Array<AnyBulkWriteOperation<IAssessmentResult>> = [];

    const resultIdsToMark: Types.ObjectId[] = [];
    for (const assessment of assessments) {
      const resultsToEnd = assessmentResults.filter(r => r.assessment.equals(assessment._id));

      for (const result of resultsToEnd) {
        resultIdsToMark.push(result._id);
        if (result.endedAt) {
          continue;
        }
        const resultWithAssessment = { ...result, assessment: assessment } as IAssessmentResult;
        const expectedEndDateTimeResult = getExpectedEndDateTime(resultWithAssessment);
        if (!expectedEndDateTimeResult.expectedEndDateTime) {
          continue;
        }
        bulkWrites.push({
          updateOne: {
            filter: { _id: result._id, endedAt: { $exists: false } },
            update: {
              $set: { endedAt: expectedEndDateTimeResult.expectedEndDateTime },
            }
          }
        });
      }
    }
    if (bulkWrites.length >= 1) {
      await AssessmentResult.bulkWrite(bulkWrites);
    }

    return { assessmentIds: [...assessmentEndedIds, ...assessmentInProgressIds], resultIdsToMark: resultIdsToMark };
  };

  export const countAndSetQuestionNum = (assessmentResult: IAssessmentResult) => {
    let questionCount = 0;
    if (!Array.isArray(assessmentResult.pages)) {
      return 0;
    }
    for (const page of assessmentResult.pages) {
      if (!Array.isArray(page.responses)) {
        continue;
      }
      // remove deleted questions
      // page.responses = page.responses.filter((response) => !response.deleted);
      for (const response of page.responses) {
        if ((response?.quizItem as IQuizItem)?.isQuestion) {
          response.questionNum = ++questionCount;
        }
      }
    }
    return questionCount;
  }

  export const setAssessmentResultDuration = (assessmentResult: IAssessmentResult) => {
    const endTime = assessmentResult.endedAt ?? new Date();
    if (assessmentResult.startedAt) {
      let minutes = Math.round((endTime.getTime() - assessmentResult.startedAt.getTime()) / 60000);
      let hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      minutes -= hours * 60;
      hours -= days * 24;
      assessmentResult.duration = assessmentResult.endedAt ? '' : 'At least '
      if (days) {
        assessmentResult.duration += `${days} day${days >= 2 ? 's' : ''} `
      }
      if (hours) {
        assessmentResult.duration += `${hours} hour${hours >= 2 ? 's' : ''} `
      }
      if (minutes) {
        assessmentResult.duration += `${minutes} minute${minutes >= 2 ? 's' : ''}`
      }
      if (!minutes && !hours && !days) {
        assessmentResult.duration = 'Less than a minute'
      }
    }
  }

  export const assessmentResultSelectOptions = { assessment: 1, evaluatee: 1, 'evaluator.evaluator_id': 1, 'pages.pageNum': 1, 'pages.completed': 1, 'pages.responses._id': 1, 'pages.responses.quizItem': 1, 'pages.responses.completed': 1, 'pages.responses.deleted': 1, startedAt: 1, endedAt: 1, totalRewards: 1 };

  export const genEmptyResponses = (
    questions: IQuestion[]
  ): IAssessmentResultPage["responses"] => {
    return questions.map((q) => {
      const emptyResponse: IAssessmentResultPage["responses"][number] = {
        quizItem: q._id,
        completed: false,
        // deleted: false
        rewards: { [RewardType.POINT]: 0, [RewardType.SCORE]: 0 },
      } as IAssessmentResultPage["responses"][number];
      if (Array.isArray(q.options)) {
        emptyResponse.options = q.options.map((o) => o._id as Types.ObjectId);
      }
      (emptyResponse as any).type = q.type;
      return emptyResponse;
    });
  };

  export const genNewAssessmentResultPages = (
    emptyResponses: IAssessmentResultPage["responses"],
    shuffleOptions: IAssessment["shuffle"],
    maxQuestionLimitPerPage?: IAssessment["maxQuestionLimitPerPage"]
  ) => {
    const newResponses = emptyResponses.map((emptyResponse) => {
      const newResponse = { ...emptyResponse };
      delete newResponse.options;
      if (Array.isArray(emptyResponse.options)) {
        if ((emptyResponse as any).type === QuizItemType.MCQ) {
          if (shuffleOptions.options) {
            shuffleArray(emptyResponse.options);
            newResponse["options"] = [...emptyResponse.options];
          }
          // no need to place options if options not shuffled
        } else {
          newResponse["options"] = [...emptyResponse.options];
        }
      }
      return newResponse;
    });
    if (shuffleOptions.questions) {
      shuffleArray(newResponses);
    }

    const pages: IAssessmentResultPage[] = [];
    if (maxQuestionLimitPerPage && maxQuestionLimitPerPage >= 1) {
      for (let i = 0; i < newResponses.length; i += maxQuestionLimitPerPage) {
        pages.push({
          pageNum: Math.floor(i / maxQuestionLimitPerPage) + 1,
          responses: newResponses.slice(i, i + maxQuestionLimitPerPage),
          completed: false,
        });
      }
    } else {
      pages.push({ pageNum: 1, responses: newResponses, completed: false });
    }
    return pages;
  };

  export const getClientAccessCode = async (clientId: string) => {
    const result = await AssessmentResult.find({
      "evaluator.type": EvaluatorType.CLIENT,
      "evaluator.evaluator_id": clientId,
    })
      .select({ "evaluator.access_code": 1 })
      .lean();

    if (result.length === 0) {
      throw new ErrorWithCode(404, {
        message: "No assessment has been assigned to this client.",
      });
    }

    if (result.length >= 2) {
      console.error(
        `ERROR: ${result.length} assessments (expected ONE only) have been assigned to client ${clientId}`
      );
    }

    if (!result[0].evaluator.access_code) {
      throw new ErrorWithCode(500, {
        message: "Access code has not been generated for this client.",
      });
    }

    return result[0].evaluator.access_code;
  };

  export const getPopulateOptions = (isForMarking?: boolean, quizItemsOnly?: boolean, populateQuiz?: boolean): PopulateOptions[] => {
    const assessmentPopulateOpt: PopulateOptions = {
      path: 'assessment', select: {
        numId: 1,
        type: 1,
        title: 1,
        description: 1,
        public: 1,
        batch: 1,
        quiz_assigned: 1,
        start_at: 1,
        ended_at: 1,
        duration: 1,
        isBackNavigationAllowed: 1,
        isPublicForReview: 1
      }, model: Assessment
    };
    if (populateQuiz) {
      assessmentPopulateOpt.populate = {
        path: 'quiz_assigned', select: {
          rewards: 1,
        }, model: Quiz
      };
    }
    const quizItem: PopulateOptions = {
      path: 'pages.responses.quizItem', select: {
        isQuestion: 1,
        _id: 0,
      }, model: QuestionModel
    };
    const populateOpts: PopulateOptions[] = [quizItem];
    if (isForMarking) {
      quizItem.select = { ...quizItem.select, type: 1, options: { _id: 1, correctAnswer: 1 }, rewards: 1 }
      assessmentPopulateOpt.select = { quiz_assigned: 1 };
    }
    if (quizItemsOnly) {
      quizItem.select = { ...quizItem.select, type: 1, title: 1, options: { _id: 1, label: 1 }, rewards: 1 }
    } else {
      populateOpts.push(assessmentPopulateOpt);
    }
    populateOpts.push({
      path: 'evaluator.evaluator_id', select: {
        _id: 1,
        name: 1,
        matricNumber: 1
      }, model: User
    } as PopulateOptions);
    return populateOpts;
  }

  export const setAsssessmentResultCanSubmit = (assessmentResult: IAssessmentResult) => {
    assessmentResult.canSubmit = true;
    for (const page of assessmentResult.pages) {
      if (!page.completed) {
        assessmentResult.canSubmit = false;
      }
    }
  }

  export const sortAssessmentResultPages = (pages: IAssessmentResultPage[]) => {
    return pages.sort((a, b) => a.pageNum - b.pageNum);
  }

  export const markAssessmentResults = async (resultIds: Types.ObjectId[], remark?: boolean, session?: ClientSession) => {
    const aggregateOptions: AggregateOptions | undefined = session ? { session: session, readPreference: mongoose.mongo.ReadPreference.primary } : undefined;
    let assessmentResults: IAssessmentResult[] = await AssessmentResult.aggregate([
      {
        $match: { _id: { $in: resultIds } }
      }
    ], aggregateOptions);
    assert(assessmentResults.length >= 1, `Error marking assessment: Assessment results ${resultIds} not found.`);

    const assessmentIds = new Map();
    for (const result of assessmentResults) {
      if (result.assessment) {
        assessmentIds.set(result.assessment.toString(), result.assessment);
      }
    }

    const assessments: IAssessment[] = await Assessment.aggregate([
      {
        $match: { _id: { $in: Array.from(assessmentIds.values()) } }
      },
      {
        $project: { numId: 1, type: 1, title: 1, description: 1, public: 1, quiz_assigned: 1, items_assigned: 1, start_at: 1, ended_at: 1, duration: 1, isBackNavigationAllowed: 1 }
      }
    ], aggregateOptions);
    assert(assessments.length >= 1, `Error marking assessment: Assessments ${Array.from(assessmentIds.values())} not found.`);

    const quizIds = new Map();
    for (const assessment of assessments) {
      if (assessment.quiz_assigned) {
        quizIds.set(assessment.quiz_assigned.toString(), assessment.quiz_assigned);
      }
    }

    const quizItemIds = new Map();
    for (const assessment of assessments) {
      if (Array.isArray(assessment.items_assigned)) {
        for (const item of assessment.items_assigned) {
          quizItemIds.set(item.toString(), item);
        }
      }
    }

    const quizzes = await Quiz.aggregate([
      {
        $match: { _id: { $in: Array.from(quizIds.values()) } }
      },
      { $project: { rewards: 1 } }
    ], aggregateOptions);
    assert(quizzes.length >= 1, `Error marking assessment: Quizzes ${Array.from(quizIds.values())} not found.`);
    const quizMap: Map<string, IQuiz> = new Map();
    for (const quiz of quizzes) {
      quizMap.set(quiz._id.toString(), quiz);
    }

    const quizItems = await QuestionModel.aggregate([
      {
        $match: { _id: { $in: Array.from(quizItemIds.values()) } }
      },
      {
        $project: { isQuestion: 1, type: 1, options: { _id: 1, correctAnswer: 1 }, rewards: 1 }
      }
    ], aggregateOptions);
    const quizItemMap = new Map();
    for (const quizItem of quizItems) {
      quizItemMap.set(quizItem._id.toString(), quizItem);
    }

    let markedCount = 0;
    let unmarkCountDueToNotEnded = 0;
    let errorCount = 0;
    const errorMap = new Map();

    for (const assessment of assessments) {
      try {
        const currentQuiz = quizMap.get(assessment.quiz_assigned.toString());
        if (!currentQuiz) {
          errorCount++;
          const errMsg = `Error marking assessment: Quiz ${assessment.quiz_assigned} not found.`;
          console.warn(errMsg);
          errorMap.set(errMsg, true);
          continue;
        }

        const currentResults = assessmentResults.filter((a) => (a.assessment as Types.ObjectId).equals(assessment._id as Types.ObjectId));

        for (const assessmentResult of currentResults) {
          const bulkWrites: Array<AnyBulkWriteOperation<IAssessmentResult>> = [];

          const saveAssessmentResultFilterQuery: FilterQuery<IAssessmentResult> = { _id: assessmentResult._id, endedAt: { $exists: true } };
          if (!remark) {
            if (assessmentResult.totalRewards) {
              continue;
            }
            saveAssessmentResultFilterQuery.totalRewards = { $exists: false };
          }

          if (assessmentResult.endedAt) {
            assessmentResult.totalRewards = { [RewardType.POINT]: 0, [RewardType.SCORE]: 0 };
            if (assessmentResult.startedAt) {
              for (const page of assessmentResult.pages) {
                if (!Array.isArray(page.responses)) {
                  continue;
                }
                const saveAssessmentResultPageFilterQuery: FilterQuery<IAssessmentResult> = { ...saveAssessmentResultFilterQuery, pages: { "$elemMatch": { _id: page._id, } } };
                for (const response of page.responses) {
                  if (response.quizItem && quizItemMap.has(response.quizItem.toString())) {
                    response.quizItem = quizItemMap.get(response.quizItem.toString());
                  } else {
                    errorCount++;
                    const errMsg = `Error marking assessment: Quiz item ${response.quizItem} not found.`;
                    console.warn(errMsg);
                    errorMap.set(errMsg, true);
                    continue;
                  }
                  if (!currentQuiz.rewards[RewardType.POINT] && !currentQuiz.rewards[RewardType.SCORE]) {
                    response.rewards[RewardType.POINT] = 0;
                    response.rewards[RewardType.SCORE] = 0;
                    continue;
                  }
                  if (!(response.quizItem as IQuizItem).isQuestion) {
                    continue;
                  }
                  const maxPoints = (response.quizItem as IQuestion).rewards?.[RewardType.POINT];
                  const maxScore = (response.quizItem as IQuestion).rewards?.[RewardType.SCORE];
                  response.rewards = { [RewardType.POINT]: 0, [RewardType.SCORE]: 0 };
                  switch ((response.quizItem as IQuestion).type) {
                    case QuizItemType.MCQ:
                      const correctOption = (response.quizItem as IMultiChoiceQuestion).options?.find((option) => option.correctAnswer);
                      if (!correctOption) {
                        errorCount++;
                        const errMsg = `Error marking assessment: Correct option not found for quiz item ${response.quizItem}.`;
                        console.warn(errMsg);
                        errorMap.set(errMsg, true);
                      }
                      if (correctOption && response.response && (response.response as Types.ObjectId).equals(correctOption._id)) {
                        response.rewards[RewardType.POINT] = currentQuiz.rewards[RewardType.POINT] ? (maxPoints ?? 0) : 0;
                        response.rewards[RewardType.SCORE] = currentQuiz.rewards[RewardType.SCORE] ? (maxScore ?? 0) : 0;
                        assessmentResult.totalRewards[RewardType.POINT] += response.rewards[RewardType.POINT];
                        assessmentResult.totalRewards[RewardType.SCORE] += response.rewards[RewardType.SCORE];
                      }
                      break;
                    case QuizItemType.LIKERT:
                      const scales = (response.quizItem as ILikertQuestion).options.map((o, i) => (i + 1) / (response.quizItem as ILikertQuestion).options.length);
                      response.rewards[RewardType.POINT] = 0;
                      response.rewards[RewardType.SCORE] = 0
                      for (const optionId of Object.values(response.likert_response as unknown as Types.Map<Types.ObjectId>)) {
                        const scaleIndex = (response.quizItem as ILikertQuestion).options.findIndex((o) => (o._id as Types.ObjectId).equals(optionId));
                        if (scaleIndex < 0) {
                          errorCount++;
                          const errMsg = `Error marking assessment: Likert option not found with id ${optionId}.`;
                          console.warn(errMsg);
                          errorMap.set(errMsg, true);
                          continue;
                        }
                        if (currentQuiz.rewards[RewardType.POINT]) {
                          response.rewards[RewardType.POINT] += scales[scaleIndex] * (maxPoints ?? 0);
                        }
                        if (currentQuiz.rewards[RewardType.SCORE]) {
                          response.rewards[RewardType.SCORE] += scales[scaleIndex] * (maxScore ?? 0);
                        }
                      }
                      assessmentResult.totalRewards[RewardType.POINT] += response.rewards[RewardType.POINT];
                      assessmentResult.totalRewards[RewardType.SCORE] += response.rewards[RewardType.SCORE];
                      break;
                  }
                  bulkWrites.push({
                    updateOne: {
                      filter: saveAssessmentResultPageFilterQuery,
                      update: {
                        $set: { 'pages.$.responses.$[response].rewards': response.rewards, },
                      },
                      arrayFilters: [{ 'response._id': { $eq: response._id } }]
                    }
                  });
                }
              }

              if (!remark && assessment.type === AssessmentType.SelfAssessment && currentQuiz.rewards[RewardType.POINT] && assessmentResult.totalRewards[RewardType.POINT] > 0) {
                createNewNotification({ recipient: assessmentResult.evaluator.evaluator_id as Types.ObjectId, message: `Congratulations, you have received ${assessmentResult.totalRewards[RewardType.POINT]} point${assessmentResult.totalRewards[RewardType.POINT] > 1 ? 's' : ''} from assessment A${assessment.numId}: ${assessment.title}`, type: "info" })
                  .catch((err) => {
                    console.error(err);
                  });
              }

            }

            bulkWrites.push({
              updateOne: {
                filter: saveAssessmentResultFilterQuery,
                update: {
                  $set: { totalRewards: assessmentResult!.totalRewards },
                }
              }
            });
            if (bulkWrites.length >= 1) {
              await AssessmentResult.bulkWrite(bulkWrites, session ? { session: session } : undefined);
            }
            markedCount++;
          } else {
            unmarkCountDueToNotEnded++;
          }
        }

      } catch (error) {
        console.error(error);
      }
    }
    return { markedCount: markedCount, unmarkCountDueToNotEnded: unmarkCountDueToNotEnded, errorCount: errorCount, errors: Array.from(errorMap.keys()) };
  }

  export const autoEndAndMarkAssessmentResult = async () => {
    const endResult = await AssessmentResultService.endAssessmentResults();
    if (endResult.resultIdsToMark.length >= 1) {
      await AssessmentResultService.markAssessmentResults(endResult.resultIdsToMark);
    }
    const assessments = await AssessmentResult.aggregate([
      {
        $match: { assessment: { $in: endResult.assessmentIds }, totalRewards: { $exists: false } }
      },
      {
        $group: {
          _id: { assessment: "$assessment" },
        }
      },
    ]);

    const assessmentNotMarkedIds = [];
    for (const assessment of assessments) {
      assessmentNotMarkedIds.push(assessment._id.assessment.toString());
    }

    const bulkWrites: Array<AnyBulkWriteOperation<IAssessment>> = [];
    for (const assessmentId of endResult.assessmentIds) {
      if (!assessmentNotMarkedIds.includes(assessmentId.toString())) {
        bulkWrites.push({
          updateOne: {
            filter: { _id: assessmentId },
            update: {
              $set: { endedAndMarked: true },
            }
          }
        });
      }
    }

    if (bulkWrites.length >= 1) {
      await Assessment.bulkWrite(bulkWrites);
    }
  };

  export const createSendEmailJob = async (
    data: JobData.ISendClientEvaluationEmail
  ) => {
    const jobDoc: IJob = new JobModel({
      jobContent: `Assessment A${data.assessmentNumId}: Send email to client ${data.clientName} at ${data.clientEmail}`,
      type: 4,
      assessmentResultId: data.assessmentResultId,
      status: "pending",
    });
    return jobDoc;
  };

  export const addSendEmailJob = async (
    jobId: string,
    data: JobData.ISendClientEvaluationEmail
  ) => {
    const job = await mainQueue.add(
      JobType.SEND_EMAIL,
      {
        jobType: JobType.SEND_EMAIL,
        data: data,
      },
      { jobId: jobId }
    );
    return job;
  };

  export const sendAssessmentAssignedNotification = async (assessment: IAssessment, upsertedIdMap: BulkWriteResult['upsertedIds']) => {
    if (!upsertedIdMap) {
      console.error('Error sending notification for assessment assigned to student: input is empty.');
    }
    try {
      if (![AssessmentType.SelfAssessment, AssessmentType.PeerEvaluation].includes(assessment.type)) {
        return;
      }
      const upsertedIds = Object.values(upsertedIdMap);
      if (Array.isArray(upsertedIds) && upsertedIds.length >= 1) {
        const results = await AssessmentResult.aggregate([{
          $match: {
            _id: { $in: upsertedIds }
          }
        },
        {
          $project: {
            evaluator: {
              evaluator_id: { $toString: "$evaluator.evaluator_id" }
            }
          }
        }]);
        const evaluatorIds = new Set(results.filter((r) => r.evaluator.evaluator_id).map((r) => r.evaluator.evaluator_id as string));
        for (const id of evaluatorIds) {
          await createNewNotification({ recipient: new Types.ObjectId(id), message: `The ${assessment.title} has been assigned to you.`, type: "info" });
        }
      }
    } catch (err) {
      console.error('Error sending notification for assessment assigned to student', err);
    }
  }

  export const isHaveAssessmentResult = async (
    studentId: mongoose.Types.ObjectId
  ) => {
    const assessmentResult = await AssessmentResult.find({
      $or: [{ "evaluator.evaluator_id": studentId }, { evaluatee: studentId }],
    });
    return assessmentResult.length > 0;
  };

  export const removeStudentAssessmentResult = async (
    studentId: mongoose.Types.ObjectId,
    batch: string,
    session: mongoose.ClientSession
  ) => {
    try {
      const assessments = await AssessmentService.getAssessmentByBatch(
        batch,
        session
      );

      if (assessments != null && assessments.length > 0) {
        const assessmentIds = assessments.map((assessment) => assessment._id);
        const assessmentResult = await AssessmentResult.deleteMany({
          $or: [
            { "evaluator.evaluator_id": studentId },
            { "evaluatee": studentId }
          ],
          "assessment": { $in: assessmentIds }
        }, { session });

        console.log("Assessment results deleted:", assessmentResult);
        return assessmentResult.acknowledged;
      }
      return false;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const getSelfAssessmentResultByStudentId = async (
    studentId: mongoose.Types.ObjectId,
    batchId: mongoose.Types.ObjectId
  ) => {
    try {
      const assessmentResult = await AssessmentResult.aggregate([
        {
          $lookup: {
            from: "assessments",
            localField: "assessment",
            foreignField: "_id",
            as: "assessment",
          },
        },
        {
          $unwind: {
            path: "$assessment",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "quizzes",
            localField: "assessment.quiz_assigned",
            foreignField: "_id",
            as: "assessment.quiz_assigned",
          },
        },
        {
          $unwind: {
            path: "$assessment.quiz_assigned",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "quizitems",
            localField: "assessment.quiz_assigned.items",
            foreignField: "_id",
            as: "assessment.quiz_assigned.items",
          },
        },
        {
          $match: {
            "evaluator.type": 1,
            "evaluator.evaluator_id": studentId,
            "assessment.type": 0,
            "assessment.batch": batchId,
            endedAt: { $exists: true, $ne: null }
          },
        },
        {
          $project: {
            _id: 1,
            assessmentId: "$assessment._id",
            assessmentName: "$assessment.title",
            startedAt: 1,
            endedAt: 1,
            totalRewards: 1,
            pages: 1,
            quiz_item: "$assessment.quiz_assigned.items",
          },
        },
      ]);

      return assessmentResult;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const extractPointAndScoreFromAssessmentResult = (
    assessmentResult: any
  ) => {
    try {
      if (assessmentResult === null || assessmentResult === undefined) {
        return ["-", "-"];
      }
      let pointObtained = "-";
      let scoreObtained = "-";
      let totalPoint = 0;
      let totalScore = 0;
      if (assessmentResult.totalRewards !== undefined) {
        if (assessmentResult.totalRewards["0"] !== undefined) {
          pointObtained = assessmentResult.totalRewards["0"];
        }
        if (assessmentResult.totalRewards["1"] !== undefined) {
          scoreObtained = assessmentResult.totalRewards["1"];
        }

        for (const q of assessmentResult.quiz_item) {
          if (q.rewards !== undefined) {
            if (q.rewards["0"] !== undefined) {
              totalPoint += q.rewards["0"];
            }
            if (q.rewards["1"] !== undefined) {
              totalScore += q.rewards["1"];
            }
          }
        }
      }

      let pointReturned = pointObtained === '-' ? pointObtained : `${pointObtained}/${totalPoint}`;
      let scoreReturned = scoreObtained === '-' ? scoreObtained : `${scoreObtained}/${totalScore}`;

      return [pointReturned, scoreReturned];
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const getCorrectAnswerFromAssessmentResult = async (assessmentResult: any) => {
    try {
      if (assessmentResult === null || assessmentResult === undefined) {
        return null;
      }

      let questionCount = 0;
      let correct = 0;

      for(const page of assessmentResult.pages) {
        for(const response of page.responses) {
          const responseId = response.response;
          if(!responseId) {
            continue;
          }

          const question = await QuestionModel.findOne({ "options._id": responseId }).select({ "options.$": 1 });
          if(question && question.options && question.options.length > 0) {
            if(question.options[0].correctAnswer) {
              correct++;
            }
          }
          questionCount++;
        }
      }

      return questionCount > 0 ? `${correct}/${questionCount}` : `-`;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const getPeerAssessmentResultInStudentProfileByStudentId = async (studentOrGroupId: mongoose.Types.ObjectId, batchId: mongoose.Types.ObjectId, evaluatorType: number, assessmentType: number) => {
    try {
      const assessmentResult = await AssessmentResult.aggregate([
        {
          $lookup: {
            from: "assessments",
            localField: "assessment",
            foreignField: "_id",
            as: "assessment"
          }
        },
        {
          $unwind: {
            path: "$assessment",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "quizzes",
            localField: "assessment.quiz_assigned",
            foreignField: "_id",
            as: "assessment.quiz_assigned"
          }
        },
        {
          $unwind: {
            path: "$assessment.quiz_assigned",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "quizitems",
            localField:
              "assessment.quiz_assigned.items",
            foreignField: "_id",
            as: "assessment.quiz_assigned.items"
          }
        },
        {
          $match: {
            "evaluator.type": evaluatorType,
            evaluatee: studentOrGroupId,
            "assessment.type": assessmentType,
            "assessment.batch": batchId,
            endedAt: { $exists: true, $ne: null }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "evaluator.evaluator_id",
            foreignField: "_id",
            as: "evaluator_profile"
          }
        },
        {
          $unwind: {
            path: "$evaluator_profile",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            assessment: 1,
            evaluator: {
              _id: "$evaluator_profile._id",
              name: "$evaluator_profile.name",
              access_code: "$evaluator.access_code"
            },
            evaluatee: 1,
            pages: 1,
            endedAt: 1
          }
        }
      ]);

      return assessmentResult;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const extractIdsArray = (item: any, IdsArray: mongoose.Types.ObjectId[]) => {
    try {
      if (item.pages !== undefined && item.pages !== null && item.pages.length > 0) {
        for (const p of item.pages) {
          if (p.responses !== undefined && p.responses !== null && p.responses.length > 0) {
            for (const r of p.responses) {
              if (r.completed === true && r.likert_response !== undefined && r.likert_response !== null) {
                IdsArray.push(Object.values(r.likert_response as mongoose.Types.ObjectId)[0]);
              }
            }
          }
        }
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  export const getTotalScoreFromAssessmentResult = async (objectIds: mongoose.Types.ObjectId[]) => {
    try {
      let totalScore = 0;
      let scoreObtained = 0;

      for (const id of objectIds) {
        const question = await QuestionModel.findOne({ type: QuizItemType.LIKERT, "options._id": { $in: id } });
        let score = 0;
        if (question !== null && question !== undefined && question.options !== undefined && question.options !== null && question.options.length > 0) {
          for (const option of question.options) {
            score++;
            if (String(option._id).toString() === String(id).toString()) {
              scoreObtained += score;
            }
          }
          totalScore += score;
        }
      }
      return [scoreObtained, totalScore];
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const removeAssessmentResult = async (assessmentResultId: mongoose.Types.ObjectId) => {
    try {
      const result = await AssessmentResult.deleteOne({ _id: assessmentResultId });
      return result.acknowledged;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  export const getStudentTotalRewardWithBatch = async () => {
    try {
      const result = await AssessmentResult.aggregate([
        {
          $lookup:
          {
            from: "assessments",
            localField: "assessment",
            foreignField: "_id",
            as: "assessment"
          }
        },
        {
          $unwind:
          {
            path: "$assessment",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match:
          {
            "assessment.type": 0
          }
        },
        {
          $lookup:
          {
            from: "categories",
            localField: "assessment.batch",
            foreignField: "_id",
            as: "category"
          }
        },
        {
          $unwind:
          {
            path: "$category",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project:
          {
            _id: "$evaluator.evaluator_id",
            batch: "$category.name",
            totalRewards: "$totalRewards"
          }
        }
      ]);

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export { AssessmentResultService };
