import { AuthRequest } from './../middlewares/authMiddleware';
import Assessment, { AssessmentType, IAssessment } from '../models/Assessment';
import { Response } from "express";
import dotenv from 'dotenv';
import User from '../models/User';
import mongoose, { AnyBulkWriteOperation, FilterQuery, FlattenMaps, Model, ObjectId, PipelineStage, PopulateOptions, Types } from 'mongoose';
import { successResponse } from '../utils/response';
import { IQuizItem, IQuestion, QuestionModel, QuizItem, QuizItemType, createUnknownQuestion, ILikertQuestion, createUnknownOptions, IMultiChoiceQuestion } from '../models/QuizItem';
import Quiz, { IQuiz, RewardType } from '../models/Quiz';
import Student, { IStudent } from '../models/Student';
import { shuffleArray } from '../utils/array';
import AssessmentResult, { AssessmentResultSubmittedPage, EvaluatorType, IAssessmentResult, IAssessmentResultPage, IAssessmentResultPageSubmitted, IAssessmentResultMultiple } from '../models/AssessmentResult';
import { AssessmentController } from './assessmentController';
import qs from 'qs';
import { MongooseSelectOptions } from '../utils/types';
import { ASSESSMENT_SUBMISSION_GRACE_PERIOD_IN_MINUTES, MS_PER_MINUTE } from '../utils/constants';
import assert from 'node:assert';
import { mainQueue } from '../queue/QueueManager';
import { JobType } from '../queue/initializeMainWorker';
import JobModel, { JobData } from '../models/Job';
import { ErrorWithCode } from '../utils/error';
import { AssessmentResultService } from '../services/AssessmentResultService';
import { createNewNotification } from '../services/NotificationService';
import Group, { IGroup } from '../models/Group';
import Project from '../models/Project';
import Category, { ICategory } from '../models/Category';

dotenv.config();

namespace AssessmentResultController {
    export const getMyAssessmentList = async (req: AuthRequest, res: Response) => {
        try {
            const { batch } = req.query;
            const helper = new AssessmentResultRequestHelper(req, res);
            if (!helper.verifyUser()) {
                return;
            }
            let myAssessmentList = await helper.getMyAssessments(false, false, false, true, batch as string);

            // hide non-public assessments
            myAssessmentList = myAssessmentList.filter((result) => (result.assessment as IAssessment).public);

            // only show distinct peer assessments without repeating same assessment with different evaluatees
            const resultMap = new Map();
            for (const assessmentResult of myAssessmentList) {
                if (resultMap.has(assessmentResult.assessment._id)) {
                    continue;
                }
                resultMap.set(assessmentResult.assessment._id, assessmentResult);
            }
            res.json(successResponse(Array.from(resultMap.values()), "My assessment list fetched successfully"));
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }



    export const getAssessment = async (req: AuthRequest, res: Response) => {
        try {
            const helper = new AssessmentResultRequestHelper(req, res);
            if (!helper.verifyAccess()) {
                return;
            }

            let results = await helper.getMyAssessments(true);
            if (results.length === 0) {
                res.status(404).json({ message: 'Assessment not found' });
                return;
            }
            const quiz = await Quiz.findById((results[0].assessment as IAssessment).quiz_assigned).select({ rewards: 1 }).lean() ?? undefined;
            const assessmentResultMultiple: IAssessmentResultMultiple = { results: results, quiz: quiz, canSubmitAll: true };

            const expectedEndDateTimeResult = AssessmentResultService.getExpectedEndDateTime(results[0]);

            for (const assessmentResult of results) {
                if (expectedEndDateTimeResult.expectedEndDateTime) {
                    assessmentResult.endedAt = expectedEndDateTimeResult.expectedEndDateTime;
                }
                AssessmentResultService.sortAssessmentResultPages(assessmentResult.pages);
                AssessmentResultService.setAsssessmentResultCanSubmit(assessmentResult);
                if (!assessmentResult.canSubmit) {
                    assessmentResultMultiple.canSubmitAll = false;
                }
                helper.hideNonPublicAssessment(assessmentResult.assessment as IAssessment);
                AssessmentResultService.setAssessmentResultDuration(assessmentResult);
            }

            res.json(successResponse(assessmentResultMultiple, "Assessment fetched successfully"));
            if (expectedEndDateTimeResult.expectedEndDateTime) {
                await helper.endAssessments(expectedEndDateTimeResult.expectedEndDateTime);
            }
        } catch (err: any) {
            console.error(err);
            if (!res.headersSent) {
                res.status(500).json({ message: err.message });
            }
        }
    }

    export class AssessmentResultRequestHelper {
        public readonly req: AuthRequest;
        public readonly res: Response;
        public readonly assessmentId: string;
        public readonly userId?: string;
        public readonly userRole?: string;
        public readonly isLecturer: boolean;
        public readonly clientAccessCode?: qs.ParsedQs[string];
        public readonly evaluatorId?: qs.ParsedQs[string];
        public readonly evaluateeId?: string;

        constructor(req: AuthRequest, res: Response) {
            this.req = req;
            this.res = res;
            this.assessmentId = req.params.assessment_id;
            this.clientAccessCode = req.query.accessCode;
            if (req.user && req.user.userId) {
                this.userId = req.user.userId as unknown as string;
                this.userRole = req.user.role;
                this.isLecturer = req.user.role === 'lecturer';
                if (this.isLecturer) {
                    this.evaluatorId = req.query.evaluatorId;
                }
            } else {
                this.isLecturer = false;
            }
            if (typeof req.query.evaluateeId === 'string') {
                this.evaluateeId = req.query.evaluateeId;
            }
        }

        public verifyAccess() {
            if ((!this.userId && !this.clientAccessCode) || (typeof this.clientAccessCode === 'string' && this.clientAccessCode.length !== 36)) {
                this.res.status(401).json({ message: 'Unauthorized: Missing/invalid user credentials or client access code.' });
                return false;
            }
            return true;
        }

        public verifyUser() {
            if (!this.userId) {
                this.res.status(401).json({ message: 'Unauthorized: Missing/invalid user credentials.' });
                return false;
            }
            return true;
        }

        // checks eligibility to access / save assessment results, and automatically end assessment result if exceeded assessment's end date time or its maximum duration allowed
        public async verifyEligibility(res: Response, assessmentResult: IAssessmentResult | 404, isEndAssessmentRequest?: boolean, pageNum?: number, reviewMode?: boolean) {
            // result.expectedEndDateTime exist if user did not end (submit) their assessment results (assessmentResult.endedAt) on time.
            // if result.expectedEndDateTime exists, it will be set as the most late date time without adding any grace period, either the assessment's end time or (the date time after adding maximmum duration allowed to the date time when user starts the assessment, i.e. assessmentResult.startedAt), whichever is earlier.
            const result: { eligibility: boolean; expectedEndDateTime?: Date, status?: number, jsonResponse?: Response['json'] } = { eligibility: true };
            if (assessmentResult === 404) {
                result.eligibility = false;
                res.status(404).json({ message: 'Assessment not found.' });
                return result;
            }
            if (this.isLecturer) {
                return result;
            } else if (reviewMode) {
                if (!assessmentResult.startedAt) {
                    result.eligibility = false;
                    res.status(403).json({ message: 'Cannot review assessment result that was not attempted.' });
                } else if (!assessmentResult.endedAt) {
                    result.eligibility = false;
                    res.status(403).json({ message: 'Cannot review assessment result before submission.' });
                }
                return result;
            }

            if (!(assessmentResult.assessment as IAssessment).public) {
                result.eligibility = false;
                res.status(403).json({ message: 'Assessment is hidden.' });
            } else if (!assessmentResult.startedAt) {
                result.eligibility = false;
                res.status(403).json({ message: 'Assessment has not started.' });
            } else if (assessmentResult.endedAt) {
                result.eligibility = false;
                res.status(403).json({ message: 'Assessment result has already been submitted and ended.' });
            } else if ((assessmentResult.assessment as IAssessment).start_at.getTime() > Date.now()) {
                result.eligibility = false;
                res.status(403).json({ message: 'Assessment has not started.' });
            }
            const expectedEndDateTimeResult = AssessmentResultService.getExpectedEndDateTime(assessmentResult);
            if (expectedEndDateTimeResult.expectedEndDateTime) {
                result.eligibility = false;
                result.expectedEndDateTime = expectedEndDateTimeResult.expectedEndDateTime;
                if (expectedEndDateTimeResult.ended && !isEndAssessmentRequest) {
                    res.status(403).json({ message: 'Assessment has ended.' });
                } else if (expectedEndDateTimeResult.exceeded && !res.headersSent && !isEndAssessmentRequest) {
                    res.status(403).json({ message: 'Assessment duration used has exceeded maximum assessment duratioin limit.' });
                }
            }
            if (!isNaN(pageNum!) && !(assessmentResult.assessment as IAssessment).isBackNavigationAllowed) {
                const nextPage = assessmentResult.pages.find((page: IAssessmentResultPage) => page.pageNum === pageNum! + 1);
                if (nextPage && nextPage.completed) {
                    result.eligibility = false;
                    if (!res.headersSent) {
                        res.status(403).json({ message: 'Cannot access/save previous assessment page when back navigation is disabled.' });
                    }
                }
            }

            if (result.expectedEndDateTime) {
                await this.endAssessments(result.expectedEndDateTime);
            }
            return result;
        }

        // apply filters on given db query based on evaluator, client access code, and/or evaluatee information.
        public setfilterQuery(filterQuery: FilterQuery<any>) {
            if (this.clientAccessCode) {
                filterQuery['evaluator.access_code'] = this.clientAccessCode;
            } else if (this.userId) {
                if (this.isLecturer) {
                    if (this.evaluatorId) {
                        filterQuery['evaluator.evaluator_id'] = new Types.ObjectId(this.evaluatorId as string);
                    }
                } else {
                    filterQuery['evaluator.evaluator_id'] = new Types.ObjectId(this.userId);
                }
                if (this.evaluateeId) {
                    filterQuery.evaluatee = new Types.ObjectId(this.evaluateeId);
                }
                if (this.assessmentId) {
                    filterQuery.assessment = new Types.ObjectId(this.assessmentId);
                }
            }
            return filterQuery;
        }

        public hideNonPublicAssessment(assessment: IAssessment) {
            if (this.isLecturer) {
                return;
            }
            if (!assessment.public) {
                assessment.title = 'Hidden Assessment';
                assessment.description = 'Assessment is not public. Please contact lecturer for more information.';
                delete (assessment as any)['start_at'];
                delete (assessment as any)['ended_at'];
            }
        }

        // get one or more assessments without details such as question and option title
        public async getMyAssessments(sortByEvaluatee?: boolean, quizItemsOnly?: boolean, disableSetClockAndTimeLeft?: boolean, populateQuiz?: boolean, batch?: string) {
            let batch_category: ICategory | null | undefined;
            if(batch) {
                batch_category = await Category.findOne({ type: 0, name: batch }).select('_id').lean();
                if(!batch_category) {
                    throw new Error(`Bacth ${batch} not found.`);
                }
            }
            const populateOpts = AssessmentResultService.getPopulateOptions(false, quizItemsOnly, populateQuiz);
            const filterQuery = this.setfilterQuery({});
            delete filterQuery.evaluatee;

            let assessmentResults: IAssessmentResult[] = await AssessmentResult.find(filterQuery)
                .select(AssessmentResultService.assessmentResultSelectOptions)
                .populate(populateOpts).limit(this.clientAccessCode ? 1 : 0).lean();

            if(batch_category) {
                assessmentResults = assessmentResults.filter(a => ((a.assessment as IAssessment)?.batch as Types.ObjectId).equals(batch_category!._id));
            }
            const studentEvaluateeIds = assessmentResults.filter(r => r.evaluatee).map(r => r.evaluatee);
            const studentEvaluatees = studentEvaluateeIds.length >= 1 ? (await Student.aggregate([{
                $match: {
                    _id: { $in: studentEvaluateeIds }
                }
            }])) : [];

            for (const assessmentResult of assessmentResults) {
                if (assessmentResult.evaluatee) {
                    if ((assessmentResult.assessment as IAssessment)?.type === AssessmentType.PeerEvaluation) {
                        assessmentResult.evaluatee = studentEvaluatees.find((s) => s._id.equals(assessmentResult.evaluatee)) ?? assessmentResult.evaluatee;
                    } else if ((assessmentResult.assessment as IAssessment)?.type === AssessmentType.ClientEvaluation) {
                        assessmentResult.evaluatee = (await Group.findById(assessmentResult.evaluatee).select({ name: 1, project: 1 }).populate({
                            path: 'project', select: {
                                title: 1,
                            }, model: Project
                        }).lean()) ?? assessmentResult.evaluatee;
                    }
                }
                if (!quizItemsOnly) {
                    assessmentResult.questionCount = AssessmentResultService.countAndSetQuestionNum(assessmentResult);
                }
                if((assessmentResult.evaluator?.evaluator_id as any)?._id) {
                    assessmentResult.evaluator.label = (assessmentResult.evaluator.evaluator_id as any).name;
                    if((assessmentResult.evaluator.evaluator_id as any).matricNumber) {
                        assessmentResult.evaluator.label += ` (${(assessmentResult.evaluator.evaluator_id as any).matricNumber})`;
                    }
                    assessmentResult.evaluator.evaluator_id = (assessmentResult.evaluator.evaluator_id as any)._id;
                }
            }

            if (assessmentResults.length >= 1) {
                if (sortByEvaluatee && assessmentResults[0].evaluatee) {
                    assessmentResults.sort((a, b) => {
                        const aIsString = typeof (a.evaluatee as IStudent).matricNumber === 'string';
                        const bIsString = typeof (b.evaluatee as IStudent).matricNumber === 'string';
                        if (aIsString && bIsString) {
                            return (a.evaluatee as IStudent).matricNumber.localeCompare((b.evaluatee as IStudent).matricNumber);
                        } else if (aIsString) {
                            return -1;
                        } else if (bIsString) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    for (let i = 0; i < assessmentResults.length; i++) {
                        assessmentResults[i].order = i;
                        if (!quizItemsOnly && !(assessmentResults[i].assessment as IAssessment)?.isPublicForReview) {
                            delete assessmentResults[i].totalRewards;
                        }
                    }
                    if (this.evaluateeId) {
                        assessmentResults.sort((a, b) => (a.evaluatee as IStudent)._id.toString() === this.evaluateeId ? -1 : 0);
                    }
                }

                AssessmentController.setAssessmentTypeLabel(assessmentResults[0].assessment as IAssessment);
                if (!disableSetClockAndTimeLeft) {
                    AssessmentResultService.setClockAndTimeLeft(assessmentResults[0]);
                }
            }

            return assessmentResults;
        }

        // get specific assessment page(s) with populated questions and options
        public async getAssessmentPage(pageRange: number[], reviewMode?: boolean) {
            const pipeline: PipelineStage[] = [
                {
                    $match: this.setfilterQuery({})
                },
                {
                    $lookup: {
                        from: "assessments",
                        localField: "assessment",
                        foreignField: "_id",
                        as: "assessment",
                        pipeline: [{ $project: { _id: 1, type: 1, start_at: 1, ended_at: 1, duration: 1, isBackNavigationAllowed: 1, isPublicForReview: 1, quiz_assigned: 1, public: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "evaluatee",
                        foreignField: "_id",
                        as: "evaluatee",
                        pipeline: [{ $project: { _id: 1, name: 1, matricNumber: 1 } }],
                    },
                },
                {
                    $project: {
                        pages: 1,
                        pagesFiltered: {
                            $filter: {
                                input: '$pages',
                                as: 'page',
                                cond: { $in: ['$$page.pageNum', pageRange] }
                            }
                        },
                        assessment: 1,
                        startedAt: 1,
                        endedAt: 1,
                        evaluatee: 1,
                        completed: true
                    }
                },
                {
                    $lookup: {
                        from: "quizzes",
                        localField: "assessment.quiz_assigned",
                        foreignField: "_id",
                        as: "quiz",
                        pipeline: [{ $project: { _id: 1, rewards: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: "quizitems",
                        localField: "pages.responses.quizItem",
                        foreignField: "_id",
                        as: "quizItems",
                        pipeline: [{ $project: { _id: { $toString: "$_id" }, type: 1, isQuestion: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: "quizitems",
                        localField: "pagesFiltered.responses.quizItem",
                        foreignField: "_id",
                        as: "quizItemsFiltered",
                        pipeline: [{ $project: { _id: { $toString: "$_id" }, type: 1, isQuestion: 1, title: 1, options: { _id: 1, label: 1 }, likert_statements: { _id: 1, label: 1 }, required: 1, multiline: 1, rewards: 1 } }],
                    },
                }
            ];

            const responsesMapIn = {
                _id: "$$rF._id",
                quizItem: { $toString: "$$rF.quizItem" },
                options: "$$rF.options",
                completed: "$$rF.completed",
                // deleted: "$$rF.deleted",
                response: "$$rF.response",
                op_answer: "$$rF.op_answer",
                likert_response: "$$rF.likert_response",
            };
            if (reviewMode) {
                (responsesMapIn as any).rewards = "$$rF.rewards";
            }

            const resultProject: PipelineStage.Project['$project'] = {
                pages: {
                    $map: {
                        "input": "$pages",
                        "as": "p",
                        "in": {
                            _id: "$$p._id",
                            pageNum: "$$p.pageNum",
                            responses: {
                                $map: {
                                    "input": "$$p.responses",
                                    "as": "r",
                                    "in": {
                                        _id: "$$r._id",
                                        quizItem: { $toString: "$$r.quizItem" },
                                        completed: "$$r.completed",
                                        // deleted: "$$r.deleted",
                                    }
                                }
                            },
                            completed: "$$p.completed",
                        }
                    }
                },
                pagesFiltered: {
                    $map: {
                        "input": "$pagesFiltered",
                        "as": "pF",
                        "in": {
                            _id: "$$pF._id",
                            pageNum: "$$pF.pageNum",
                            responses: {
                                $map: {
                                    "input": "$$pF.responses",
                                    "as": "rF",
                                    "in": responsesMapIn
                                }
                            },
                            completed: "$$pF.completed",
                        }
                    }
                },
                assessment: 1,
                quizItems: 1,
                quizItemsFiltered: 1,
                startedAt: 1,
                endedAt: 1,
                evaluatee: 1,
                completed: true
            };

            pipeline.push({ $project: resultProject });
            const assessmentResults: IAssessmentResult[] = await AssessmentResult.aggregate(pipeline);

            if (assessmentResults.length === 0 || !Array.isArray(assessmentResults[0].assessment as unknown as any[]) || (assessmentResults[0].assessment as unknown as any[]).length === 0) {
                return 404;
            }
            const assessmentResult = assessmentResults[0];
            assessmentResult.assessment = (assessmentResult.assessment as unknown as IAssessment[])[0];
            const assessment = assessmentResult.assessment;
            if (!this.isLecturer) {
                this.hideNonPublicAssessment(assessment);
            }

            if (!Array.isArray((assessmentResult as any).quizItemsFiltered)) {
                (assessmentResult as any).quizItemsFiltered = [];
            }
            if (Array.isArray((assessmentResult as any).quizItems)) {
                (assessmentResult as any).quizItemsFiltered.push(...(assessmentResult as any).quizItems);
            }
            if (Array.isArray((assessmentResult as any).evaluatee) && (assessmentResult as any).evaluatee.length >= 1) {
                (assessmentResult as any).evaluatee = (assessmentResult as any).evaluatee[0];
            }

            assessmentResult.lastPage = 0;

            if (Array.isArray(assessmentResult.pages)) {
                if ('pagesFiltered' in assessmentResult) {
                    assessmentResult.pages = assessmentResult.pages.map((page, index) => {
                        const pageFound = (assessmentResult.pagesFiltered as IAssessmentResult['pages']).find((filteredPage) => (filteredPage._id as Types.ObjectId).equals(page._id));
                        if (!pageFound) {
                            return page;
                        }
                        assessmentResult.currentPage = index + 1;
                        return pageFound;
                    });
                }
                assessmentResult.pages = AssessmentResultService.sortAssessmentResultPages(assessmentResult.pages);
                for (const page of assessmentResult.pages) {
                    if (page.pageNum > assessmentResult.lastPage) {
                        assessmentResult.lastPage = page.pageNum;
                    }
                    // page.responses = page.responses.filter((response) => !response.deleted); // remove soft-deleted responses
                    page.responses = page.responses.map((response) => {
                        const quizItemFound = (assessmentResult as any).quizItemsFiltered.find((quizItem: IQuizItem) => quizItem._id === response.quizItem) as IQuizItem; 7
                        response.quizItem = quizItemFound ?? createUnknownQuestion(response.quizItem as Types.ObjectId, response.options);
                        if (response.quizItem.type === QuizItemType.MCQ) {
                            response.response = response.response ?? null;
                        } else if (response.quizItem.type === QuizItemType.LIKERT) {
                            response.likert_response = response.likert_response ?? new Map() as IAssessmentResultPageSubmitted['responses'][number]['likert_response'];
                        } else if (response.quizItem.type === QuizItemType.OEQ) {
                            response.op_answer = response.op_answer ?? '';
                        }
                        if (quizItemFound && [QuizItemType.MCQ, QuizItemType.LIKERT].includes(quizItemFound.type)) {
                            if (response.quizItem.type === QuizItemType.LIKERT || !Array.isArray(response.options) || response.options?.length === 0) {
                                (response.options as any) = (response.quizItem as IQuestion).options ?? [];
                            } else if (Array.isArray(response.options)) {
                                if (Array.isArray((quizItemFound as IQuestion).options)) {
                                    (response.options as any) = response.options.map((oId) => (response.quizItem as IQuestion).options.find((o) => (o._id as Types.ObjectId).equals(oId)) ?? { _id: oId, label: oId });
                                } else {
                                    (response.options as any) = createUnknownOptions(response.options);
                                }
                            }
                        }
                        return response;
                    });
                }
            }
            assessmentResult.questionCount = AssessmentResultService.countAndSetQuestionNum(assessmentResult);
            delete (assessmentResult as any)['quizItems'];
            delete (assessmentResult as any)['quizItemsFiltered'];
            delete (assessmentResult as any)['pagesFiltered'];
            // AssessmentController.setAssessmentTypeLabel(assessment);
            return assessmentResult;
        }

        public async markAssessments() {
            const filterQuery: FilterQuery<IAssessmentResult> = { endedAt: { $exists: true } };
            this.setfilterQuery(filterQuery);
            delete filterQuery.evaluatee;

            let assessmentResults = await AssessmentResult.find(filterQuery).select({ _id: 1 }).lean();
            if (assessmentResults.length === 0) {
                console.error(`Assessment results not found so cannot be marked.`);
            }

            await AssessmentResultService.markAssessmentResults(assessmentResults.map(result => result._id));
        }

        public async endAssessments(endDate: Date) {
            const filterQuery: FilterQuery<IAssessmentResult> = { endedAt: { $exists: false } };
            this.setfilterQuery(filterQuery);
            delete filterQuery.evaluatee;

            // update many is used so that ending a peer assessment ends the assessment result for all evaluatees that are evaluated by the same person
            let result = await AssessmentResult.updateMany(
                filterQuery,
                { $set: { endedAt: endDate } },
                { new: false }).lean();

            await this.markAssessments();

            return result;
        }
    }

    export const getAssessmentPage = async (req: AuthRequest, res: Response) => {
        try {
            const helper = new AssessmentResultRequestHelper(req, res);
            const page_num = req.params.page_num;
            const pageNum = parseInt(page_num) || 0;
            const pageRange = [pageNum];
            if (!helper.verifyAccess()) {
                return;
            }

            const assessmentResult = await helper.getAssessmentPage(pageRange, !!req.query.reviewMode);
            if (!(await helper.verifyEligibility(res, assessmentResult, false, pageNum, !!req.query.reviewMode)).eligibility) {
                return;
            }
            assert(assessmentResult !== 404);
            AssessmentResultService.setClockAndTimeLeft(assessmentResult);
            res.json(successResponse(assessmentResult, "Assessment page fetched successfully"));
        } catch (err: any) {
            res.status(500).json({ message: err.message });
            console.error(err);
        }
    }

    export const saveAssessmentPage = async (req: AuthRequest, res: Response) => {
        try {
            const helper = new AssessmentResultRequestHelper(req, res);
            const page_num = req.params.page_num;
            const goBack = req.query.goBack;
            const pageNum = parseInt(page_num) || 1;
            const pageRange = [pageNum - 1, pageNum, pageNum + 1];

            if (!helper.verifyAccess()) {
                return;
            }

            const updatedAssessmentPageDoc = new AssessmentResultSubmittedPage(req.body);
            const invalidPayload = updatedAssessmentPageDoc.validateSync();
            if (invalidPayload) {
                res.status(400).json({ message: 'Invalid payload.' });
                console.error(invalidPayload);
                return;
            }
            // const updatedAssessment = updatedAssessmentDoc.toObject();
            // console.log(updatedAssessmentPageDoc, updatedAssessmentPageDoc.responses);

            const assessmentResult = await helper.getAssessmentPage(pageRange);

            if (!(await helper.verifyEligibility(res, assessmentResult, false, pageNum)).eligibility) {
                return;
            }
            assert(assessmentResult !== 404);

            const assessmentResultPage = assessmentResult.pages.find((page) => (page._id as Types.ObjectId).equals(updatedAssessmentPageDoc._id));
            if (!assessmentResultPage) {
                res.status(404).json({ message: 'Assessment page not found.' });
                return;
            }

            const bulkWrites: Array<AnyBulkWriteOperation<IAssessmentResult>> = [];
            const saveAssessmentResultFilterQuery: FilterQuery<IAssessmentResult> = helper.setfilterQuery({ pages: { "$elemMatch": { _id: updatedAssessmentPageDoc._id, } }, startedAt: { $exists: true }, endedAt: { $exists: false } });
            for (const response of updatedAssessmentPageDoc.responses) {
                const assessmentResultPageResponse = assessmentResultPage.responses.find((oldResponse) => (oldResponse._id as Types.ObjectId).equals(response._id));
                // skip missing reponse
                if (!assessmentResultPageResponse) {
                    console.error(`Missing response ${response._id}`);
                    continue;
                }
                // skip non-questions
                if (!(assessmentResultPageResponse.quizItem as IQuizItem).isQuestion) {
                    continue;
                }
                let setQuery;
                if ((assessmentResultPageResponse.quizItem as IQuizItem).type === QuizItemType.MCQ && response.response) {
                    setQuery = {
                        'pages.$.responses.$[response].response': response.response,
                        'pages.$.responses.$[response].completed': true
                    };
                    assessmentResultPageResponse.completed = true;
                } else if ((assessmentResultPageResponse.quizItem as IQuizItem).type === QuizItemType.LIKERT && response.likert_response instanceof Map && Array.isArray((assessmentResultPageResponse.quizItem as ILikertQuestion).likert_statements) && (assessmentResultPageResponse.quizItem as ILikertQuestion).likert_statements!.length >= 1) {
                    const acceptedLikertResponse = new Map() as IAssessmentResultPageSubmitted['responses'][number]['likert_response'];
                    // filter and ensure only valid likert response is recorded
                    if (!(assessmentResultPageResponse.quizItem as ILikertQuestion).likert_statements) {
                        continue;
                    }
                    let likertCompleted = true;
                    for (const statement of (assessmentResultPageResponse.quizItem as ILikertQuestion).likert_statements!) {
                        if (response.likert_response.has((statement._id as Types.ObjectId).toString())) {
                            acceptedLikertResponse!.set((statement._id as Types.ObjectId).toString(), response.likert_response.get((statement._id as Types.ObjectId).toString())!);
                        } else {
                            likertCompleted = false;
                        }
                    }
                    setQuery = {
                        'pages.$.responses.$[response].likert_response': acceptedLikertResponse,
                        'pages.$.responses.$[response].completed': likertCompleted
                    };
                    if (likertCompleted) {
                        // console.log(acceptedLikertResponse)
                    }
                    // console.log(likertCompleted);
                    assessmentResultPageResponse.completed = likertCompleted;
                } else if ((assessmentResultPageResponse.quizItem as IQuizItem).type === QuizItemType.OEQ && typeof response.op_answer === 'string') {
                    setQuery = { 'pages.$.responses.$[response].op_answer': response.op_answer };
                    if (response.op_answer.trim().length >= 1) {
                        (setQuery as any)['pages.$.responses.$[response].completed'] = true;
                        assessmentResultPageResponse.completed = true;
                    } else {
                        (setQuery as any)['pages.$.responses.$[response].completed'] = false;
                        assessmentResultPageResponse.completed = false;
                    }
                } else {
                    continue;
                }
                bulkWrites.push({
                    updateOne: {
                        filter: saveAssessmentResultFilterQuery,
                        update: {
                            $set: setQuery,
                        },
                        arrayFilters: [{ 'response._id': { $eq: response._id } }]
                    }
                });
            }

            // update page completion status
            // WARNING: Page completion is vulnerable to race condition, e.g. if new response is inserted into the page but not answered
            // TODO: Use transaction and findandupdateone() with new true. Abort transaction if updated page contains any uncompleted required response
            let pageCompleted = true;
            let assessmentResultCompleted = true;
            for (const response of assessmentResultPage.responses) {
                if ((response.quizItem as IQuizItem).isQuestion && (response.quizItem as IQuestion).required) {
                    if (!response.completed) {
                        pageCompleted = false;
                        assessmentResultPage.completed = false;
                    }
                }
            }
            if (pageCompleted !== assessmentResultPage.completed) {
                assessmentResultPage.completed = pageCompleted;
                bulkWrites.push({
                    updateOne: {
                        filter: saveAssessmentResultFilterQuery,
                        update: {
                            $set: { 'pages.$.completed': assessmentResultPage.completed },
                        },
                    }
                });
            }
            for (const page of assessmentResult.pages) {
                if (!page.completed) {
                    assessmentResultCompleted = false;
                    break;
                }
            }
            if (assessmentResultCompleted !== assessmentResult.completed) {
                bulkWrites.push({
                    updateOne: {
                        filter: saveAssessmentResultFilterQuery,
                        update: {
                            $set: { 'completed': assessmentResultCompleted },
                        },
                    }
                });
            }
            AssessmentResultService.setAsssessmentResultCanSubmit(assessmentResult);

            const result = await AssessmentResult.bulkWrite(bulkWrites);

            if ((goBack && assessmentResultPage.pageNum === 1) || (!goBack && pageCompleted && assessmentResult.lastPage === assessmentResultPage.pageNum)) {
                assessmentResult.currentPage = -1;
                AssessmentResultService.setAssessmentResultDuration(assessmentResult);
            } else if (pageCompleted && !goBack) {
                assessmentResult.currentPage = assessmentResultPage.pageNum + 1;
            } else if (pageCompleted && goBack) {
                assessmentResult.currentPage = assessmentResultPage.pageNum - 1;
            }

            AssessmentResultService.setClockAndTimeLeft(assessmentResult);

            res.json(successResponse(assessmentResult, `Assessment saved successfully. Updated ${result.modifiedCount} response(s).`));
        } catch (err: any) {
            res.status(500).json({ message: err.message });
            console.error(err);
        }
    }

    export const startAssessments = async (req: AuthRequest, res: Response) => {
        try {
            const helper = new AssessmentResultRequestHelper(req, res);
            if (!helper.verifyAccess()) {
                return;
            }

            const filterQuery: FilterQuery<IAssessmentResult> = { startedAt: { $exists: false }, endedAt: { $exists: false } };
            helper.setfilterQuery(filterQuery);
            delete filterQuery.evaluatee;

            const firstAssessmentResult = await helper.getAssessmentPage([1]);
            if (firstAssessmentResult === 404) {
                res.status(500).json({ message: 'Assessment not found after starting it.' });
                return;
            }
            if ((new Date()).getTime() < (firstAssessmentResult.assessment as IAssessment).start_at.getTime()) {
                res.status(403).json({ message: 'Assessment has not started yet.' });
                return;
            }
            if ((new Date()).getTime() > (firstAssessmentResult.assessment as IAssessment).ended_at.getTime()) {
                res.status(403).json({ message: 'Assessment has already ended.' });
                return;
            }

            const startedAt = new Date();
            firstAssessmentResult.startedAt = startedAt;

            // update many is used so that starting a peer assessment starts the assessment result for all evaluatees that are evaluated by the same person
            let result = await AssessmentResult.updateMany(
                filterQuery,
                { $set: { startedAt: startedAt } });
            if (result.matchedCount === 0) {
                console.error('User have already started the assessment or it has ended.');
            }

            if (firstAssessmentResult.endedAt) {
                res.status(403).json({ message: 'Assessment has already ended.' });
                return;
            }

            AssessmentResultService.setClockAndTimeLeft(firstAssessmentResult);
            res.json(successResponse(firstAssessmentResult, "Assessment started successfully"));
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    export const endAssessments = async (req: AuthRequest, res: Response) => {
        try {
            const helper = new AssessmentResultRequestHelper(req, res);
            if (!helper.verifyAccess()) {
                return;
            }

            const assessmentResults = await helper.getMyAssessments(false, false, true);
            if (assessmentResults.length === 0) {
                res.status(404).json({ message: 'Assessment not found' });
                return;
            }
            const assessmentResult = assessmentResults[0];
            const eligibilityResult = await helper.verifyEligibility(res, assessmentResult, true);
            if (res.headersSent) {
                return;
            };
            assessmentResult.pages = AssessmentResultService.sortAssessmentResultPages(assessmentResult.pages);

            const endedAt = eligibilityResult.expectedEndDateTime ?? new Date();
            if (eligibilityResult.eligibility) {
                const result = await helper.endAssessments(endedAt);

                if (result.matchedCount === 0) {
                    res.status(500).json({ message: `Failed to end assessment ${helper.assessmentId}` });
                    return;
                }
            }

            assessmentResult.endedAt = endedAt;
            (assessmentResult as any).timeLeft = 0;
            AssessmentResultService.setAssessmentResultDuration(assessmentResult);
            // const assessment = result[0].assessment as IAssessment;
            // hideNonPublicAssessment(assessment);

            res.json(successResponse(assessmentResult, "Assessment ended successfully"));
            if ((assessmentResult.assessment as IAssessment)?.type === AssessmentType.ClientEvaluation) {
                let clientName;
                let groupName;
                if (assessmentResult.evaluator?.evaluator_id) {
                    clientName = (await User.findById(assessmentResult.evaluator?.evaluator_id).select('name').lean())?.name;
                }
                if (assessmentResult.evaluatee) {
                    groupName = (assessmentResult.evaluatee as IGroup)?.name;
                }
                await createNewNotification({ message: `Client ${clientName ?? 'Unknown'} has completed evaluation A${(assessmentResult.assessment as IAssessment)?.numId} for group ${groupName ?? 'Unknown'}.`, type: "info" });
            }
        } catch (err: any) {
            if (!res.headersSent) {
                res.status(500).json({ message: err.message });
            }
            console.error(err);
        }
    }

    export const getClientAssessmentAccessCode = async (req: AuthRequest, res: Response) => {
        try {
            const accessCode = await AssessmentResultService.getClientAccessCode(req.params.client_id);
            res.json(successResponse(accessCode, "Client access code fetched successfully."));
        } catch (err: any) {
            if (err instanceof ErrorWithCode) {
                res.status(err.responseCode).json(err.response);
                return;
            }
            res.status(500).json({ message: err.message });
        }
    }

    export const getAssessmentResultList = async (req: AuthRequest, res: Response) => {
        try {
            const filterAssessmentTypes = Object.entries(req.body.filter.assessment_types).filter(([type, isEnabled]) => isEnabled).map(([type, isEnabled]) => parseInt(type));
            const result: { assessments: { [key: string]: IAssessment }, results: IAssessmentResult[] } = { assessments: {}, results: [] };

            let assessmentIds = [];
            if (Array.isArray(req.body.filter.assessment_ids) && req.body.filter.assessment_ids.length >= 1) {
                assessmentIds = req.body.filter.assessment_ids.map((id: string) => new Types.ObjectId(id));
            }

            const elemMatchFilterQuery: FilterQuery<any> = { type: { $in: filterAssessmentTypes } };
            if (req.body.filter.assessment_ids.length >= 1) {
                elemMatchFilterQuery._id = { $in: assessmentIds };
            }

            const assessments = await Assessment.aggregate([
                {
                    $match: elemMatchFilterQuery
                },
                {
                    $lookup: {
                        from: "quizzes",
                        localField: "quiz_assigned",
                        foreignField: "_id",
                        as: "quiz_assigned",
                        pipeline: [{ $project: { rewards: 1 } }],
                    },
                },
                { $project: { _id: { $toString: "$_id" }, numId: 1, title: 1, description: 1, type: 1, quiz_assigned: { $arrayElemAt: ["$quiz_assigned", 0] }, start_at: 1, ended_at: 1, duration: 1, isBackNavigationAllowed: 1, public: 1 } }
            ]);

            if (assessmentIds.length >= 1) {
                result.results = await AssessmentResult.aggregate([
                    {
                        $lookup: {
                            from: "assessments",
                            localField: "assessment",
                            foreignField: "_id",
                            as: "populatedAssessment",
                            pipeline: [{ $project: { _id: 1, type: 1 } }],
                        },
                    },
                    {
                        $match: {
                            populatedAssessment: {
                                $elemMatch: elemMatchFilterQuery
                            }
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "evaluator.evaluator_id",
                            foreignField: "_id",
                            as: "evaluator.evaluator",
                            pipeline: [{ $project: { _id: 1, name: 1, matricNumber: 1 } }],
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "evaluatee",
                            foreignField: "_id",
                            as: "evaluateeStudent",
                            pipeline: [{ $project: { _id: 1, name: 1, matricNumber: 1 } }],
                        },
                    },
                    {
                        $lookup: {
                            from: "groups",
                            localField: "evaluatee",
                            foreignField: "_id",
                            as: "evaluateeGroup",
                            pipeline: [{ $project: { _id: 1, name: 1 } }],
                        },
                    },
                    {
                        $lookup: {
                            from: "jobs",
                            localField: "_id",
                            foreignField: "assessmentResultId",
                            as: "emailJob",
                            pipeline: [{ $project: { error: 1, status: 1, updatedAt: 1 } }, { $sort: { _id: -1 } }, { $limit: 1 }],
                        },
                    },
                    {
                        $project: {
                            _id: 1, assessment: 1, evaluator: { type: 1, evaluator_id: 1, access_code: 1, evaluator: { $arrayElemAt: ["$evaluator.evaluator", 0] } }, evaluatee: 1, startedAt: 1, endedAt: 1,
                            evaluateeStudent: { $arrayElemAt: ["$evaluateeStudent", 0] },
                            evaluateeGroup: { $arrayElemAt: ["$evaluateeGroup", 0] },
                            totalRewards: 1,
                            emailJob: { $arrayElemAt: ["$emailJob", 0] },
                            completed: 1
                        }
                    }]);
            };

            for (let i = 0; i < assessments.length; i++) {
                result.assessments[assessments[i]._id] = assessments[i];
                // assessmentResult.questionCount = countAndSetQuestionNum(assessmentResult);
            }

            res.json(successResponse(result, "Assessment result list fetched successfully"));
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    export const deleteAssessmentResult = async (req: AuthRequest, res: Response) => {
        try {
            const { assessment_result_id } = req.params;

            const assessmentResult = await AssessmentResult.findByIdAndDelete(assessment_result_id);
            res.json(successResponse(assessmentResult, 'Assessment result deleted successfully'));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    export const deleteManyAssessmentResult = async (req: AuthRequest, res: Response) => {
        try {
            const { deleteIds } = req.body;
            if (!Array.isArray(deleteIds) || deleteIds.length === 0) {
                res.status(400).json({ message: 'Error deleting assessment result(s): Empty deleteIds.' });
                return;
            }

            const deleteResult = await AssessmentResult.deleteMany({ _id: { $in: deleteIds } });
            if (!deleteResult || !deleteResult.deletedCount) {
                res.status(404).json({ message: 'Error deleting assessment result(s): Result not found.' });
                return;
            }
            res.json(successResponse({}, deleteResult.deletedCount + ' assessment result(s) deleted successfully.'));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    export const sendClientEmail = async (req: AuthRequest, res: Response) => {
        try {
            if ((!Array.isArray(req.body.firstEmailAssessmentResultIds) || req.body.firstEmailAssessmentResultIds.length === 0) && (!Array.isArray(req.body.resendEmailAssessmentResultIds) || req.body.resendEmailAssessmentResultIds.length === 0)) {
                res.status(400).json({ message: 'Empty assessment result id received.' });
                return;
            }

            const firstEmailAssessmentResultIdSet = new Set(req.body.firstEmailAssessmentResultIds);

            const resultIds = (req.body.firstEmailAssessmentResultIds.concat(req.body.resendEmailAssessmentResultIds)).map((resultId: string) => new Types.ObjectId(resultId));

            const results = await AssessmentResult.aggregate([
                {
                    $match: {
                        _id: {
                            $in: resultIds
                        },
                        'evaluator.type': EvaluatorType.CLIENT
                    }
                },
                {
                    $project: { _id: 1, assessment: 1, evaluator: 1 }
                },
                {
                    $lookup: {
                        from: "assessments",
                        localField: "assessment",
                        foreignField: "_id",
                        as: "assessment",
                        pipeline: [{ $project: { numId: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "evaluator.evaluator_id",
                        foreignField: "_id",
                        as: "evaluator.evaluator",
                        pipeline: [{ $project: { name: 1, email: 1 } }],
                    },
                },
                {
                    $lookup: {
                        from: "jobs",
                        localField: "_id",
                        foreignField: "assessmentResultId",
                        as: "emailJob",
                        pipeline: [{ $project: { _id: 1 } }, { $limit: 1 }],
                    },
                },
                {
                    $project: { _id: { $toString: "$_id" }, assessment: { $arrayElemAt: ["$assessment", 0] }, evaluator: { type: 1, evaluator_id: 1, access_code: 1, evaluator: { $arrayElemAt: ["$evaluator.evaluator", 0] } }, emailJob: { $arrayElemAt: ["$emailJob", 0] } }
                }
            ]);

            if (results.length === 0) {
                res.status(400).json({ message: 'Could not find assessment results with client evaluator.' });
                return;
            }

            let jobDocList: any = [];
            let jobDataList: any = [];

            for (const result of results) {
                if (!result.assessment) {
                    console.error(`Skipped sending email: Assessment not found for result id ${result._id}.`);
                    continue;
                }
                if (!result.evaluator.evaluator) {
                    console.error(`Skipped sending email: Client id ${result.evaluator.evaluator_id} not found.`);
                    continue;
                }
                if (result.emailJob && firstEmailAssessmentResultIdSet.has(result._id)) {
                    console.error(`Skipped sending email: Email job id ${result.emailJob._id} already exists.`);
                    continue;
                }
                const data: JobData.ISendClientEvaluationEmail = {
                    type: 4,
                    assessmentNumId: result.assessment.numId,
                    assessmentResultId: result._id,
                    clientId: result.evaluator.evaluator._id,
                    clientName: result.evaluator.evaluator.name,
                    clientEmail: result.evaluator.evaluator.email,
                    clientAccessCode: result.evaluator.access_code
                };
                const jobDoc = await AssessmentResultService.createSendEmailJob(data);
                jobDocList.push(jobDoc);
                jobDataList.push(data);
            }

            if (jobDataList.length === 0) {
                res.status(500).json({ message: 'No email job created.' });
                return;
            }

            await JobModel.insertMany(jobDocList);

            for (let i = 0; i < jobDataList.length; i++) {
                await AssessmentResultService.addSendEmailJob(jobDocList[i]._id.toString(), jobDataList[i]);
            }
            res.json(successResponse({}, 'Send client(s) email requested successfully. Email status has been refreshed automatically. Click refresh again to refresh email job status at any time.'));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
            console.error(error);
        }
    }

    export const remarkAssessmentResults = async (req: AuthRequest, res: Response) => {
        try {
            let resultIds = req.body.resultIds;
            if (!Array.isArray(resultIds) || resultIds.length === 0) {
                res.status(400).json({ message: 'Empty assessment result id received.' });
                return;
            }
            resultIds = resultIds.map((id => new Types.ObjectId(id as string)));
            const result = await AssessmentResultService.markAssessmentResults(resultIds, true);
            let message = `${result.markedCount}/${resultIds.length} assessment results have been marked. Rewards have been refreshed automatically.`;
            if (result.unmarkCountDueToNotEnded) {
                message += ` ${result.unmarkCountDueToNotEnded} assessment result(s) not marked as they have not been submitted.`;
            }
            if (result.errorCount) {
                message += `\nHowever, there ${result.errorCount === 1 ? 'is' : 'are'} ${result.errorCount} error(s) which can be viewed in console/server logs.`;
            }
            res.json(successResponse({ errMsg: result.errors.join('\n') }, message));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
            console.error(error);
        }
    }
}

export { AssessmentResultController }