import { AuthRequest } from './../middlewares/authMiddleware';
import Quiz, { RewardType } from '../models/Quiz';
import { Response } from "express";
import dotenv from 'dotenv';
import { AnyBulkWriteOperation, FilterQuery, FlattenMaps, PopulateOptions, Types } from 'mongoose';
import { successResponse } from '../utils/response';
import { IQuestion, IQuizItem, QuestionModel, QuizItemType } from '../models/QuizItem';
import mongoose from 'mongoose';
import { ReadPreference } from 'mongodb';
import Assessment, { IAssessment } from '../models/Assessment';
import AssessmentResult, { IAssessmentResult } from '../models/AssessmentResult';
import { shuffleArray } from '../utils/array';

dotenv.config();

namespace QuizController {
    export const getQuizList = async (req: AuthRequest, res: Response) => {
        Quiz.aggregate([
            {
                $lookup: {
                    from: "quizitems",
                    localField: "items",
                    foreignField: "_id",
                    as: "items",
                    pipeline: [{ $project: { isQuestion: 1 } }],
                },
            },
            {
                $addFields: {
                    itemCount: { $size: '$items' },
                    questionCount: {
                        $size: {
                            $filter: {
                                input: '$items',
                                as: 'item',
                                cond: { $eq: ['$$item.isQuestion', true] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    items: 0
                }
            },
            {
                $sort: {
                    _id: -1,
                },
            },
        ]).then(quizList => {
            quizList = quizList.map((quiz, index) => {
                quiz.index = index + 1;
                return quiz;
            });
            res.json(successResponse(quizList, "Quiz list fetched successfully."));
        }).catch(err => {
            res.status(500).json({ message: err.message });
        });
    }


    export const getItemList = async (req: AuthRequest, res: Response) => {
        try {
            const { quiz_id } = req.params;
            const quiz = await Quiz.aggregate([
                { $match: { _id: new Types.ObjectId(quiz_id) } },
                {
                    $lookup: {
                        from: "quizitems",
                        localField: "items",
                        foreignField: "_id",
                        as: "items",
                        pipeline: [{ $project: { _id: 1, type: 1, title: 1, rewards: 1, optionCount: { $size: "$options" }, likert_statements: 1 } }],
                    },
                },
            ]);
            if (quiz.length === 0) {
                res.status(404).json();
                return;
            }
            res.json(successResponse(quiz, "Quiz items fetched successfully."));
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    const populateOptions: PopulateOptions = {
        path: 'items', model: QuestionModel, options: { readPreference: ReadPreference.PRIMARY }
    };

    // get list of assessments that uses at least one of the supplied quiz items and a set of quiz items from the quiz items supplied that were assigned in assessments
    const getAssessmentsAndQuizItemInUse = async (itemIds: Types.ObjectId[]): Promise<{ assessments: Partial<IAssessment>[], quizItemsInUse: Set<string>}> => {
        const assessments = await Assessment.aggregate([{
            $match: { items_assigned: { $elemMatch: { $in: itemIds } } }
        },
        {
            $project: {
                shuffle: 1,
                items_assigned: {
                    $map: {
                        "input": "$items_assigned",
                        "as": "i",
                        "in": { $toString: "$$i" }
                    }
                }
            }
        }
        ]);
        const item_assigned_arrays = assessments.map((a) => a.items_assigned);
        return { assessments: assessments, quizItemsInUse: new Set([].concat(...item_assigned_arrays as any[]))};
    }

    export const getQuiz = async (req: AuthRequest, res: Response) => {
        try {
            const { quiz_id } = req.params;
            let quiz = await Quiz.findById(quiz_id).populate(populateOptions).lean();

            if (!quiz) {
                res.status(404).json({ message: 'Quiz not found' });
                return;
            }

            if (!quiz.rewards) {
                (quiz.rewards as any) = {};
            }
            if (!quiz.rewards[RewardType.POINT]) {
                quiz.rewards[RewardType.POINT] = false;
            }
            if (!quiz.rewards[RewardType.SCORE]) {
                quiz.rewards[RewardType.SCORE] = false;
            }

            // set default of correctAnswer as false
            if (Array.isArray(quiz.items)) {
                if (!req.query.clone) {
                    quiz.itemsUsedInAssessment = Object.fromEntries(Array.from((await getAssessmentsAndQuizItemInUse(quiz.items.map((i) => i._id as Types.ObjectId))).quizItemsInUse, id => [id, true]));
                }
                for (const item of quiz.items as IQuestion[]) {
                    if (item.type === QuizItemType.MCQ && Array.isArray(item.options)) {
                        for (const option of item.options) {
                            if (!option.correctAnswer) {
                                option.correctAnswer = false;
                            }
                        }
                    }
                }
            }

            if (req.query.clone === 'true') {
                const clonedQuiz: any = quiz;
                delete clonedQuiz._id;
                delete clonedQuiz.numId;
                delete clonedQuiz.createdAt;
                delete clonedQuiz.updatedAt;
                delete clonedQuiz.__v;

                if (Array.isArray(quiz.items)) {
                    for (const item of quiz.items as any[]) {
                        delete item._id;
                        delete item.__v;
                        if (Array.isArray(item.options)) {
                            for (const option of item.options) {
                                delete option._id;
                            }
                        }
                        if (Array.isArray(item.likert_statements)) {
                            for (const statement of item.likert_statements) {
                                delete statement._id;
                            }
                        }
                    }
                }
            }

            res.json(successResponse(quiz, 'Quiz fetched successfully'));
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    }

    export const createQuiz = async (req: AuthRequest, res: Response) => {
        try {
            const bulkWrites: Array<AnyBulkWriteOperation<IQuestion>> = [];
            let quizItemIdsCreated: Types.ObjectId[] = [];

            if (Array.isArray(req.body.items)) {
                for (const item of req.body.items) {
                    const createdId = new Types.ObjectId()
                    quizItemIdsCreated.push(createdId);
                    bulkWrites.push({
                        insertOne: {
                            document: { _id: createdId, ...item as any }
                        }
                    });
                }
            }

            req.body.items = quizItemIdsCreated;
            const newQuiz = new Quiz(req.body);

            const session = await mongoose.startSession();
            const result = await session.withTransaction(async () => {
                await QuestionModel.bulkWrite(bulkWrites, { session: session });
                return (await newQuiz.save({ session: session })).populate(populateOptions);
            });
            await session.endSession();


            res.json(successResponse(result, 'Quiz created successfully'));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    export const updateQuiz = async (req: AuthRequest, res: Response) => {
        try {
            const { quiz_id } = req.params;
            const bulkWrites: Array<AnyBulkWriteOperation<IQuestion>> = [];
            // optimistic concurrency control
            const quiz = await Quiz.findByIdAndUpdate(req.body._id, { $inc: { __v: 1 } }, { timestamps: false }).select({ items: 1 }).populate(populateOptions).lean();
            if (!quiz) {
                res.status(404).json({ message: 'Quiz not found.' });
                return;
            }
            const itemUsedInAssessment = (await getAssessmentsAndQuizItemInUse(quiz.items.map((i) => i._id as Types.ObjectId))).quizItemsInUse;

            const quizItemIdsToUpdate = (req.body.items as IQuizItem[]).map((item) => item._id).filter((id) => id);
            const quizItemsToDelete = quiz.items.filter(i => !quizItemIdsToUpdate.includes(i._id.toString()));
            let quizItemIdsCreated: Types.ObjectId[] = [];
            const quizItemIdsWithShuffleableOptionsChanged = new Set(); // questions with options added or removed (not edit). Only MCQ options can be shuffled. This is used to update assessment result with shuffled question options.
            let readdCount = 0;

            for (const item of req.body.items as IQuestion[]) {
                if (item._id) {
                    bulkWrites.push({
                        replaceOne: {
                            filter: { _id: new Types.ObjectId((item as any)._id as string) },
                            replacement: item as any
                        }
                    });
                    if(item.type === QuizItemType.MCQ) {
                        const quizItemWithShuffleableOptionsChanged = quiz.items.find((i) => i._id.toString() === item._id) as FlattenMaps<IQuestion>;
                        if(Array.isArray(quizItemWithShuffleableOptionsChanged?.options)) {
                            if(quizItemWithShuffleableOptionsChanged.options.length != item.options.length) {
                                quizItemIdsWithShuffleableOptionsChanged.add(item._id);
                            } else {
                                for(const iO of item.options) {
                                    if(!quizItemWithShuffleableOptionsChanged.options.find((o) => o._id.toString() === (iO._id as string))) {
                                        quizItemIdsWithShuffleableOptionsChanged.add(item._id);
                                        break;
                                    }
                                }
                            }
                        } else {
                            console.error(`Quiz item with id ${item._id} has no options.`);
                        }
                    }
                } else {
                    const createdId = new Types.ObjectId()
                    quizItemIdsCreated.push(createdId);
                    bulkWrites.push({
                        insertOne: {
                            document: { _id: createdId, ...item as any }
                        }
                    });
                }
            }
            for (const item of quizItemsToDelete) {
                if(itemUsedInAssessment.has(item._id.toString())) {
                    readdCount++;
                    quizItemIdsCreated.push(item._id as Types.ObjectId);
                } else {
                    bulkWrites.push({
                        deleteOne: {
                            filter: { _id: item._id },
                        }
                    });
                }
            }

            let assessmentsAndQuizItemInUse;

            const session = await mongoose.startSession();
            const result = await session.withTransaction(async () => {
                await QuestionModel.bulkWrite(bulkWrites, { session: session });
                req.body.items = quizItemIdsToUpdate.concat(quizItemIdsCreated);
                delete req.body.__v;
                const updatedQuiz = await Quiz.findByIdAndUpdate(quiz_id, { $set: req.body, $inc: { __v: 1 } }, { new: true, session: session, readPreference: ReadPreference.PRIMARY }).populate(populateOptions).lean();

                if (!updatedQuiz) {
                    res.status(404).json({ message: 'Quiz not found.' });
                    return;
                }

                assessmentsAndQuizItemInUse = await getAssessmentsAndQuizItemInUse(updatedQuiz.items.map((i) => i._id as Types.ObjectId));
                let resultBulkWrites: Array<AnyBulkWriteOperation<IAssessmentResult>> = [];
                for(const assessmentInUse of assessmentsAndQuizItemInUse.assessments) {
                    if(!assessmentInUse.shuffle!.options) {
                        continue;
                    }
                    for (const quizItemId of assessmentsAndQuizItemInUse.quizItemsInUse) {
                        const quizItem = updatedQuiz.items.find((i) => i._id.toString() === quizItemId);
                        if(!quizItem) {
                            console.error(`Error updating assessment result: Quiz item with id ${quizItemId} not found.`);
                            continue;
                        }
                        if(!quizItemIdsWithShuffleableOptionsChanged.has(quizItem._id.toString())) {
                            continue;
                        }
                        if(!Array.isArray((quizItem as IQuestion).options)) {
                            console.error(`Error updating assessment result: Quiz item with id ${quizItemId} has no optiions array.`);
                            continue;
                        }
                        resultBulkWrites.push({
                            updateMany: {
                              filter: { assessment: assessmentInUse._id },
                              update: {
                                $set: { 'pages.$[].responses.$[response].options': shuffleArray((quizItem as IQuestion).options.map((i) => i._id)) },
                              },
                              arrayFilters: [{ 'response.quizItem': { $eq: quizItem._id } }]
                            }
                          });
                    }
                }
                await AssessmentResult.bulkWrite(resultBulkWrites, { session: session });
                
                return updatedQuiz;

            });
            await session.endSession();
            result!.itemsUsedInAssessment = Object.fromEntries(Array.from(assessmentsAndQuizItemInUse!.quizItemsInUse, id => [id, true]));

            res.json(successResponse(result, `Quiz updated successfully.${ readdCount === 0 ? '' : ` However, ${readdCount} deleted question${readdCount === 1 ? ' was' : 's were'} re-added baack as it is being used in at least one assessment.`} If you've changed any reward / correct answer, please view assessment results that use this quiz and remark with the latest rewards set.`));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    export const deleteQuiz = async (req: AuthRequest, res: Response) => {
        try {
            const { quiz_id } = req.params;
            const assessments = await Assessment.find({ quiz_assigned: quiz_id }).select({ numId: 1, title: 1 }).lean();
            if (assessments.length >= 1) {
                res.status(405).json({ message: 'Cannot delete quiz as it is being used in the following assessment(s):' + assessments.map((a) => `\n- A${a.numId}: ${a.title}`).join('') });
                return;
            }
            const quizDeleted = await Quiz.findByIdAndDelete(quiz_id).lean();
            if (quizDeleted && Array.isArray(quizDeleted.items) && quizDeleted.items.length >= 1) {
                const results = await QuestionModel.deleteMany({
                    _id: { $in: quizDeleted.items }
                }).lean();
            }
            if (!quizDeleted) {
                res.status(404).json({ message: `Error deleting Quiz: Quiz id ${quiz_id} not found.` });
                return;
            }
            res.json(successResponse({}, `Quiz Q${quizDeleted?.numId}: ${quizDeleted?.title} deleted successfully.`));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
export { QuizController }