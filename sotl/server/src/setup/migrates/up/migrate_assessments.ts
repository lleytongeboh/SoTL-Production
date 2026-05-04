import mongoose, { ClientSession, Types } from "mongoose"; // Import ClientSession from mongoose
import Assessment, { IAssessment } from "../../../models/Assessment"; // Import the Assessment model
import Quiz, { RewardType } from "../../../models/Quiz"; // Import the Quiz model
import Category, { ICategory } from '../../../models/Category';
import Group from "../../../models/Group";
import AssessmentResult, { IAssessmentResultPage, IAssessmentResultPageSubmitted } from "../../../models/AssessmentResult"; // Import the AssessmentResult model
import assert from 'node:assert';
import { migrateAssessmentClient } from "./migrate_assessment_client";
import { migrateAssessmentPeer } from "./migrate_assessment_peer";
import { migrateAssessmentIndividual } from "./migrate_assessment_individual_assessment";
import { ILikertQuestion, IQuestion, QuestionModel, QuizItemType } from "../../../models/QuizItem";
import { AssessmentResultService } from "../../../services/AssessmentResultService";
import _ from "lodash";

export const getRandomStartEndDate = (earliestDate: Date, latestDate: Date) => {
    return new Date(Math.floor(Math.random() * (latestDate.getTime() - earliestDate.getTime() + 1)) + earliestDate.getTime());
}

export const getQuestions = async (items_assigned: Types.ObjectId[], session: ClientSession) => {
    return await QuestionModel.find({
        '_id': { $in: items_assigned }
    }).select({ type: 1, isQuestion: 1, options: 1, likert_statements: 1 }).session(session).read(mongoose.mongo.ReadPreference.PRIMARY).lean();
};

export const genCompletedResponses = async (questions: IQuestion[]) => {
    const emptyResponses = AssessmentResultService.genEmptyResponses(questions);
    for (const response of emptyResponses) {
        response.completed = true;
    }
    return emptyResponses;
};

export const genCompletedPages = async (questions: IQuestion[], responses: IAssessmentResultPage['responses'], assessment: IAssessment) => {
    const pages = AssessmentResultService.genNewAssessmentResultPages(responses, assessment.shuffle, assessment.maxQuestionLimitPerPage);
    for (const page of pages) {
        for (const response of page.responses) {
            const quizItem = questions.find((q) => (q._id as Types.ObjectId).equals(response.quizItem as Types.ObjectId));
            assert(quizItem);
            if (quizItem.type === QuizItemType.OEQ) {
                response.op_answer = '';
            } else if (Array.isArray(quizItem.options) && quizItem.options.length >= 1) {
                switch ((quizItem as any).type) {
                    case QuizItemType.MCQ:
                        response.response = _.sample(quizItem.options)!._id;
                        break;
                    case QuizItemType.LIKERT:
                        response.likert_response = new Map() as IAssessmentResultPageSubmitted['responses'][number]['likert_response'];
                        for (const statement of (quizItem as ILikertQuestion).likert_statements!) {
                            response.likert_response!.set((statement._id as Types.ObjectId).toString(), _.sample(quizItem.options)!._id.toString());
                        }
                        break;
                    default:
                        console.warn(`Question id ${quizItem._id} should not have options.`);
                }
            } else {
                throw new Error(`Options missing from question id ${quizItem._id}`);
            }
        }
        page.completed = true;
    }
    return pages;
};

// Define the migration function
export async function migrateAssessments(
    session: ClientSession
): Promise<void> {
    const batch24_25 = await Category.findOne({ name: '24/25' }).session(session).read(mongoose.mongo.ReadPreference.PRIMARY).lean() as ICategory;
    assert(batch24_25);

    const groups = await Group.aggregate([
        {
            $match: {
                batch: batch24_25.name,
                team_members: { $elemMatch: { student_id: { $in: batch24_25.belonged } } }
            }
        },
        {
            $project: {
                _id: { $toString: '$_id' },
                team_members: 1,
                project: 1
            }
        },
    ]).session(session).read(mongoose.mongo.ReadPreference.PRIMARY);

    // migrate assessment Client
    await migrateAssessmentClient(session, batch24_25, groups);

    // migrate assessment Peer
    await migrateAssessmentPeer(session, batch24_25, groups);

    // migrate assessment Individual
    await migrateAssessmentIndividual(session, batch24_25);

    const results = await AssessmentResult.find().select('_id').session(session).read(mongoose.mongo.ReadPreferenceMode.primary).lean();
    await AssessmentResultService.markAssessmentResults(results.map((r) => r._id), true, session);

}
