import { AuthRequest } from './../middlewares/authMiddleware';
import Assessment, { AssessmentType, IAssessment } from '../models/Assessment';
import { Response } from "express";
import dotenv from 'dotenv';
import User from '../models/User';
import mongoose, { AnyBulkWriteOperation, FilterQuery, FlattenMaps, ObjectId, PipelineStage, Types } from 'mongoose';
import { successResponse } from '../utils/response';
import Group, { IGroup } from '../models/Group';
import { IQuestion, QuestionModel, QuizItem, QuizItemType } from '../models/QuizItem';
import Quiz, { IQuiz } from '../models/Quiz';
import Category, { ICategory } from '../models/Category';
import Student, { IStudent } from '../models/Student';
import { shuffleArray } from '../utils/array';
import AssessmentResult, { EvaluatorType, IAssessmentResult, IAssessmentResultPage } from '../models/AssessmentResult';
import assert from 'node:assert';
import Client, { IClient } from '../models/Client';
import { MongooseSelectOptions } from '../utils/types';
import { ErrorWithCode } from '../utils/error';
import _ from 'lodash';
import { AssessmentResultService } from '../services/AssessmentResultService';

dotenv.config();

namespace AssessmentController {
    const VIEW_RESULTS_TIP_CLIENT = 'For client evaluation, please View Results and send email to clients.';

    export const setAssessmentTypeLabel = (assessment: IAssessment) => {
        const labels = {
            [AssessmentType.SelfAssessment]: 'Assessment',
            [AssessmentType.PeerEvaluation]: 'Peer Evaluation',
            [AssessmentType.ClientEvaluation]: 'Project Evaluation',
        }
        assessment.typeLabel = labels[assessment.type] ?? 'Form';
    }

    export const getAssessmentList = async (req: AuthRequest, res: Response) => {
        try {
            const filterAssessmentTypes = ((req.query.filterTypes ?? []) as string[]).map((type) => parseInt(type));
            const filterLabel = req.query.filterLabel;
            let assessmentList;

            if (filterLabel || filterLabel === '') {
                let matchFilter: FilterQuery<IAssessment> = {
                    type: { $in: filterAssessmentTypes },
                    concatLabel: { $regex: _.escapeRegExp(filterLabel.toString().trim()), $options: 'i' }
                };
                if (req.query.filterId) {
                    matchFilter = { $or: [matchFilter, { _id: new Types.ObjectId(req.query.filterId as string) }] };
                }

                assessmentList = await Assessment.aggregate([
                    {
                        $project: {
                            type: 1,
                            concatLabel: {
                                $concat: ['A', { $toString: '$numId' }, '. ', '$title', ' (',
                                    { $dateToString: { date: '$start_at', format: '%Y-%m-%d - ', timezone: '+08:00' } },
                                    { $dateToString: { date: '$ended_at', format: '%Y-%m-%d)', timezone: '+08:00' } },
                                ]
                            }
                        }
                    },
                    {
                        $match: matchFilter
                    },
                    { $sort: { _id: -1 } },
                    { $limit: 30 }
                ]);
            } else {
                assessmentList = await Assessment.find().populate([{ path: 'batch', select: 'name' }, { path: 'quiz_assigned', select: 'title' }]).lean();
            }
            res.json(successResponse(assessmentList, "Assessment list fetched successfully"));
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    const batchGroupsLookup: PipelineStage.Lookup = {
        $lookup: {
            from: "groups",
            localField: "name",
            foreignField: "batch",
            as: "groups",
            pipeline: [{ $project: { _id: 1 } }],
        },
    };


    const batchProject: PipelineStage.Project = {
        $project: {
            _id: 1,
            name: 1,
            type: 1,
            concatLabel: {
                $concat: ['$name', ' (', { $toString: { $size: '$groups' } }, ' groups / ', { $toString: { $size: '$belonged' } }, ' students)']
            }
        }
    };

    export const getBatchList = async (req: AuthRequest, res: Response) => {
        try {
            const filterQuery = req.query.filter;
            const matchFilter: FilterQuery<ICategory> = {
                type: 0
            };
            if (filterQuery) {
                matchFilter.concatLabel = { $regex: _.escapeRegExp(filterQuery.toString().trim()), $options: 'i' };
            }

            const pipeline: PipelineStage[] = [
                batchGroupsLookup,
                batchProject,
                {
                    $match: matchFilter
                },
                { $sort: { _id: -1 } },
                {
                    $limit: 100
                }
            ];
            await Category.aggregate(pipeline).then(categoryList => {
                res.json(successResponse(categoryList, "Category list fetched successfully"));
            });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    export const getGroupList = async (req: AuthRequest, res: Response) => {
        try {
            const batch = req.query.batch;
            if (!batch) {
                res.status(400).json({ message: 'Batch is required to get group list.' });
                return;
            }
            const filterMatch: FilterQuery<IGroup> = { batch: batch };
            const filterQuery = req.query.filter;
            if (filterQuery) {
                filterMatch.name = { $regex: _.escapeRegExp(filterQuery.toString().trim()), $options: 'i' }
            }
            const pipeline: PipelineStage[] = [
                {
                    $match: filterMatch
                },
                {
                    $addFields: {
                        team_members_count: { $size: '$team_members' }
                    }
                },
                {
                    $project: {
                        name: 1,
                        batch: 1,
                        team_members_count: 1
                    }
                },
                { $sort: { _id: -1 } },
                {
                    $limit: 100
                }
            ];
            await Group.aggregate(pipeline).then(groupList => {
                res.json(successResponse(groupList, "Group list fetched successfully"));
            });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    export const getStudentList = async (req: AuthRequest, res: Response) => {
        try {
            const batch = req.query.batch;
            if (!batch) {
                res.status(400).json({ message: 'Batch is required to get student list.' });
                return;
            }
            const match: FilterQuery<IGroup> = { batch: req.query.batch };
            const filterQuery = req.query.filter;
            if (filterQuery) {
                match.name = { $regex: _.escapeRegExp(filterQuery.toString().trim()), $options: 'i' }
            }
            const filter: FilterQuery<IStudent> = { batch: { $elemMatch: { batch: batch } }, role: 'student' };
            if (filterQuery) {
                filter.$or = [{ name: { $regex: _.escapeRegExp(filterQuery.toString().trim()), $options: 'i' } }, { matricNumber: { $regex: _.escapeRegExp(filterQuery.toString().trim()), $options: 'i' } }];
            }
            await User.find(filter, { name: 1, matricNumber: 1, batch: 1 }).sort({ _id: -1 }).limit(100).lean().then(studentList => {
                res.json(successResponse(studentList, "Student list fetched successfully"));
            });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    const GROUP_PIPELINE = [{ $project: { _id: 1, name: 1, team_members_count: { $size: "$team_members" }, batch: 1 } }];
    const STUDENT_PIPELINE = [{ $project: { _id: 1, matricNumber: 1, name: 1, batch: 1 } }];

    const getAssessmentCall = async (assessmentId: string | Types.ObjectId) => {
        const assessments: IAssessment[] = await Assessment.aggregate([
            { $match: { _id: assessmentId instanceof Types.ObjectId ? assessmentId : new Types.ObjectId(assessmentId) } },
            {
                $lookup: {
                    from: "quizzes",
                    localField: "quiz_assigned",
                    foreignField: "_id",
                    as: "quiz_assigned",
                    pipeline: [{ $project: { _id: 1, itemCount: { $size: "$items" }, __v: 1 } }],
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "batch",
                    foreignField: "_id",
                    as: "batch",
                    pipeline: [batchGroupsLookup, batchProject],
                },
            },
            {
                $lookup: {
                    from: "groups",
                    localField: "groups_assigned",
                    foreignField: "_id",
                    as: "groups_assigned",
                    pipeline: GROUP_PIPELINE,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "students_assigned",
                    foreignField: "_id",
                    as: "students_assigned",
                    pipeline: STUDENT_PIPELINE,
                },
            },
            {
                $lookup: {
                    from: "groups",
                    localField: "groups_excluded",
                    foreignField: "_id",
                    as: "groups_excluded",
                    pipeline: GROUP_PIPELINE,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "students_excluded",
                    foreignField: "_id",
                    as: "students_excluded",
                    pipeline: STUDENT_PIPELINE,
                },
            },
            {
                $addFields: {
                    batch: { $arrayElemAt: ["$batch", 0] }
                }
            }
        ]);
        return assessments;
    }

    export const getAssessment = async (req: AuthRequest, res: Response) => {
        try {
            const { assessment_id } = req.params;
            const assessments = await getAssessmentCall(assessment_id);
            if (!assessments || assessments.length === 0) {
                res.status(404).json({ message: 'Assessment not found' });
                return;
            }
            const assessment = assessments[0];
            if (Array.isArray(assessment.quiz_assigned) && (assessment.quiz_assigned as IQuiz[]).length >= 1) {
                assessment.quiz_assigned = assessment.quiz_assigned[0];
            }
            if (req.query.clone === 'true') {
                const clonedAssessment: any = assessment;
                delete clonedAssessment.numId;
                delete clonedAssessment.__v;
                delete clonedAssessment._id;
            }
            res.json(successResponse(assessment, 'Assessment fetched successfully'));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    const getGroupStudents = async (groups: Types.ObjectId[] | string[] | undefined) => {
        if (Array.isArray(groups) && groups.length >= 1) {
            groups = groups.map((id) => new Types.ObjectId(id));
            const students: any[] = await Group.aggregate([
                {
                    $match: {
                        '_id': { $in: groups }
                    }
                },
                {
                    $unwind: '$team_members'
                },
                {
                    $project: {
                        student_id: { $toString: '$team_members.student_id' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        membersCombined: { $addToSet: '$student_id' }, // Combine student ids
                    },
                },
            ]);
            return students;
        }
        return [];
    }

    const getStudentGroups = async (batch: string, studentIds: Types.ObjectId[]) => {
        const groups: any[] = await Group.aggregate([
            {
                $match: {
                    batch: batch,
                    team_members: { $elemMatch: { student_id: { $in: studentIds } } }
                }
            },
            {
                $project: {
                    _id: { $toString: '$_id' }
                }
            },
        ]);
        return groups.map((group) => group._id as string);
    }

    const createEditAssessment = async (req: AuthRequest, updateAssessment: IAssessment, quizVersion: number, assessment_id?: string): Promise<IAssessment> => {
        const session = await mongoose.startSession();
        const result = await session.withTransaction(async () => {
            let itemsOrShuffleChanged = false;
            if (assessment_id) {
                const oldAssessment = await Assessment.findByIdAndUpdate(assessment_id, updateAssessment, { new: false, runValidators: false, session: session }).lean();
                if (!oldAssessment) {
                    throw new ErrorWithCode(404, { message: 'Assessment not found' });
                }
                if (oldAssessment.shuffle?.questions !== updateAssessment.shuffle?.questions || oldAssessment.shuffle?.options !== updateAssessment.shuffle?.options) {
                    itemsOrShuffleChanged = true;
                } else if (updateAssessment.items_assigned.length !== oldAssessment.items_assigned.length) {
                    itemsOrShuffleChanged = true;
                } else {
                    for (const itemId of oldAssessment.items_assigned) {
                        if (!updateAssessment.items_assigned.includes(itemId)) {
                            itemsOrShuffleChanged = true;
                            break;
                        }
                    }
                }
            } else {
                if (updateAssessment.start_at < (new Date())) {
                    throw new ErrorWithCode(400, { message: 'Assessment start date time must be later than current date time.' });
                }
                updateAssessment.save({ session: session });
            }
            if (updateAssessment.shuffle.questions) {
                shuffleArray(updateAssessment.items_assigned);
            }
            let participantSet: Set<string> | undefined;
            // add categories
            if (updateAssessment.batch_assign_all) {
                const categories_assigned_students: any[] = await Category.aggregate([
                    {
                        $match: {
                            '_id': new Types.ObjectId(updateAssessment.batch as string),
                        }
                    },
                    {
                        $unwind: '$belonged'
                    },
                    {
                        $project: {
                            belonged: { $toString: '$belonged' }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            belongedCombined: { $addToSet: '$belonged' }, // Combine student ids
                        },
                    },
                ]);
                if (categories_assigned_students.length >= 1) {
                    participantSet = new Set(categories_assigned_students[0].belongedCombined);
                }
            }

            if ([AssessmentType.SelfAssessment, AssessmentType.PeerEvaluation].includes(updateAssessment.type)) {
                // add groups
                const group_assigned_students = await getGroupStudents(updateAssessment.groups_assigned);
                if (group_assigned_students.length >= 1) {
                    if (participantSet) {
                        for (const studentId of group_assigned_students[0].membersCombined) {
                            participantSet.add(studentId);
                        }
                    } else {
                        participantSet = new Set(group_assigned_students[0].membersCombined);
                    }
                }

                // add students
                if (Array.isArray(updateAssessment.students_assigned) && updateAssessment.students_assigned.length >= 1) {
                    if (participantSet) {
                        for (const studentId of updateAssessment.students_assigned) {
                            participantSet.add(studentId as string);
                        }
                    } else {
                        participantSet = new Set(updateAssessment.students_assigned as string[]);
                    }
                }
                if (!participantSet) {
                    throw new ErrorWithCode(400, { message: 'No group/student assigned.' });
                }
            }

            let groupSet: Set<string> | undefined;
            let validGroupsResult: IGroup[] | undefined;
            let validGroupIds: Types.ObjectId[] | undefined;
            let validClientResults: IClient[] | undefined;
            if ([AssessmentType.PeerEvaluation, AssessmentType.ClientEvaluation].includes(updateAssessment.type)) {
                if (participantSet) {
                    const batch = (await Category.findById(updateAssessment.batch).select('name').lean())?.name;
                    if (!batch) {
                        throw new ErrorWithCode(500, { message: 'Batch id ${updateAssessment.batch} not found.' });
                    }
                    groupSet = new Set(await getStudentGroups(batch, Array.from(participantSet).map((participantId) => new Types.ObjectId(participantId))));
                }
                if (Array.isArray(updateAssessment.groups_assigned) && updateAssessment.groups_assigned.length >= 1) {
                    if (groupSet) {
                        for (const groupId of req.body.groups_assigned) {
                            groupSet.add(groupId);
                        }
                    } else {
                        groupSet = new Set(req.body.groups_assigned);
                    }
                }
                if (!groupSet) {
                    throw new ErrorWithCode(400, { message: 'No group assigned.' });
                }

                // exclude groups
                if (Array.isArray(updateAssessment.groups_excluded) && updateAssessment.groups_excluded.length >= 1) {
                    for (const grouptId of req.body.groups_excluded) {
                        groupSet.delete(grouptId);
                    }
                }

                const groups = Array.from(groupSet);
                const selectOptions: MongooseSelectOptions<IGroup> = { _id: 1, team_members: 1 };
                if (updateAssessment.type === AssessmentType.ClientEvaluation) {
                    selectOptions.project = 1;
                }
                validGroupsResult = await Group.find({ '_id': { $in: groups } }).select(selectOptions).lean();
                if (!Array.isArray(validGroupsResult) || validGroupsResult.length === 0) {
                    throw new ErrorWithCode(400, { message: 'No valid group found.' });
                }
                validGroupIds = validGroupsResult.map((group: IGroup) => group._id as Types.ObjectId);

                if (updateAssessment.type === AssessmentType.ClientEvaluation) {
                    validClientResults = await Client.find({ 'project': { $in: validGroupsResult.filter((group) => group.project).map((group) => group.project) } }).select({ _id: 1, project: 1 } as { [k in keyof Partial<IClient>]: 1 }).lean();
                    if (!Array.isArray(validClientResults) || validClientResults.length === 0) {
                        throw new ErrorWithCode(500, { message: 'No valid client found.' });
                    }
                }
            }

            let validParticipantIds: Types.ObjectId[] | undefined;
            if ([AssessmentType.SelfAssessment, AssessmentType.PeerEvaluation].includes(updateAssessment.type)) {
                assert(participantSet);
                // exclude groups
                const group_excluded_students = await getGroupStudents(updateAssessment.groups_excluded);
                if (group_excluded_students.length >= 1) {
                    for (const studentId of group_excluded_students[0].membersCombined) {
                        participantSet.delete(studentId);
                    }
                }
                if ([AssessmentType.SelfAssessment, AssessmentType.PeerEvaluation].includes(updateAssessment.type)) {
                    // exclude students
                    if (Array.isArray(updateAssessment.students_excluded) && updateAssessment.students_excluded.length >= 1) {
                        for (const studentId of updateAssessment.students_excluded) {
                            participantSet.delete(studentId as string);
                        }
                    }
                }

                const participants = Array.from(participantSet);
                const validParticipantsResult = await Student.find({
                    '_id': { $in: participants }
                }).select({ _id: 1, __t: 0 }).lean();
                if (!Array.isArray(validParticipantsResult) || validParticipantsResult.length === 0) {
                    throw new ErrorWithCode(400, { message: 'No valid student found.' });
                }
                validParticipantIds = validParticipantsResult.map((participant: IStudent) => participant._id as Types.ObjectId);
            }

            const questions = await QuestionModel.find({
                '_id': { $in: updateAssessment.items_assigned }
            }).select({ type: 1, isQuestion: 1, options: 1 }).lean();
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new ErrorWithCode(400, { message: 'No question assigned.' });
            }
            // const questionIds = questions.map((q: QuizItem) => q._id);

            const emptyResponses = AssessmentResultService.genEmptyResponses(questions);

            const bulkWrites: Array<AnyBulkWriteOperation<IAssessmentResult>> = [];

            // begin creating assessment result for evaluator (student / client) and/or evaluatee (student / group)
            if (updateAssessment.type === AssessmentType.SelfAssessment) {
                assert(validParticipantIds);
                for (const participantId of validParticipantIds) {
                    bulkWrites.push(createAssessmentResultUpdate(updateAssessment, emptyResponses, itemsOrShuffleChanged, participantId));
                }
            } else if (updateAssessment.type === AssessmentType.PeerEvaluation) {
                assert(validParticipantIds);
                assert(validGroupsResult);
                const validParticipantIdStr: any = {};
                for (const validParticipantId of validParticipantIds) {
                    validParticipantIdStr[validParticipantId.toString()] = true;
                }

                for (const group of validGroupsResult) {
                    for (const evaluator of group.team_members) {
                        if (!validParticipantIdStr[evaluator.student_id.toString()]) {
                            continue;
                        }
                        for (const evaluatee of group.team_members) {
                            if ((evaluatee.student_id as unknown as Types.ObjectId).equals(evaluator.student_id as unknown as Types.ObjectId)) {
                                continue; // skip self evaluation
                            }
                            bulkWrites.push(createAssessmentResultUpdate(updateAssessment, emptyResponses, itemsOrShuffleChanged, evaluator.student_id as unknown as Types.ObjectId, evaluatee.student_id as unknown as Types.ObjectId));
                        }
                    }
                }
            } else if (updateAssessment.type === AssessmentType.ClientEvaluation) {
                assert(validGroupsResult);
                assert(validClientResults);
                for (const group of validGroupsResult) {
                    if (!group.project) {
                        console.error(`Error saving client evaluation assessment: Group ${group._id} has no project.`);
                        continue;
                    }
                    const clientFound = validClientResults.find((client) => client.project && (client.project as unknown as Types.ObjectId).equals(group.project as unknown as Types.ObjectId));
                    if (!clientFound) {
                        console.error(`Error saving client evaluation assessment: Group ${group._id} with project ${group.project} has no client.`);
                        continue;
                    }
                    bulkWrites.push(createAssessmentResultUpdate(updateAssessment, emptyResponses, itemsOrShuffleChanged, clientFound._id as Types.ObjectId, group._id as Types.ObjectId, crypto.randomUUID()));
                }
            } else {
                throw new Error(`Invalid assessment type ${updateAssessment.type}`);
            }

            const result = await AssessmentResult.bulkWrite(bulkWrites, { session: session });
            
            const attempt = await AssessmentResult.findOne({ assessment: updateAssessment._id, startedAt: { $exists: true }});
            
            if(itemsOrShuffleChanged && attempt) {
                throw new ErrorWithCode(409, { message: `Failed to save assessment: Cannot change items assigned or shuffle settings when there is at least one attempt in answering the assessment.` });
            }

            // optimistic concurrency control
            const quiz = await Quiz.findById(updateAssessment.quiz_assigned).select({ numId: 1, __v: 1 });
            if (quiz!.__v !== quizVersion) {
                throw new ErrorWithCode(409, { message: `Failed to save assessment as Quiz Q${quiz!.numId} was updated. Please try again.` });
            }

            return result;

            // const shuffleQuestionsUpdated = oldAssessment.shuffle.questions === updateAssessment.shuffle.questions;
            // const shuffleOptionsUpdated = oldAssessment.shuffle.options === updateAssessment.shuffle.options;
        });
        await session.endSession();
        if (result?.upsertedIds) {
            AssessmentResultService.sendAssessmentAssignedNotification(updateAssessment, result.upsertedIds);
        }
        if (assessment_id) {
            return updateAssessment.toObject();
        } else {
            const createdAssessment = (await getAssessmentCall(updateAssessment._id))[0];
            if (Array.isArray(createdAssessment.quiz_assigned) && (createdAssessment.quiz_assigned as IQuiz[]).length >= 1) {
                createdAssessment.quiz_assigned = createdAssessment.quiz_assigned[0];
            }
            return createdAssessment;
        }
    }

    export const createAssessment = async (req: AuthRequest, res: Response) => {
        try {
            if (!req.body) {
                res.status(400).json({ message: 'Empty body,' });
                return;
            }
            const quizVersion = req.body.quiz_assigned.__v;
            req.body.quiz_assigned = req.body.quiz_assigned._id;
            const newAssessment: IAssessment = new Assessment(req.body);
            newAssessment.endedAndMarked = false;
            const error = newAssessment.validateSync();
            if (error) {
                throw error;
            }

            res.json(successResponse(await createEditAssessment(req, newAssessment, quizVersion), 'Assessment created successfully. ' + VIEW_RESULTS_TIP_CLIENT));
        } catch (err: any) {
            if (err instanceof ErrorWithCode) {
                res.status(err.responseCode).json(err.response);
                return;
            }
            res.status(500).json({ message: err.message });
            console.error(err);
        }
    }

    export const editAssessment = async (req: AuthRequest, res: Response) => {
        try {
            const { assessment_id } = req.params;
            if (!req.body) {
                res.status(400).json({ message: 'Empty body,' });
                return;
            }
            delete req.body['__v'];
            const quizVersion = req.body.quiz_assigned.__v;
            req.body.quiz_assigned = req.body.quiz_assigned._id;
            const updateAssessment: IAssessment = new Assessment(req.body);
            updateAssessment.endedAndMarked = false;
            const error = updateAssessment.validateSync();
            if (error) {
                throw error;
            }

            res.json(successResponse(await createEditAssessment(req, updateAssessment, quizVersion, assessment_id), 'Assessment updated successfully. ' + VIEW_RESULTS_TIP_CLIENT));
        } catch (err: any) {
            if (err instanceof ErrorWithCode) {
                res.status(err.responseCode).json(err.response);
                return;
            }
            res.status(500).json({ message: err.message });
            console.error(err);
        }
    }

    const createAssessmentResultUpdate = (updateAssessment: IAssessment, emptyResponses: IAssessmentResultPage['responses'], itemsOrShuffleChanged: boolean, evaluatorId: Types.ObjectId, evaluateeId?: Types.ObjectId, accessCode?: string) => {
        const filter: FilterQuery<IAssessmentResult> = { 'evaluator.evaluator_id': evaluatorId, assessment: new Types.ObjectId(updateAssessment._id) };
        const setOnInsert: Partial<IAssessmentResult> = {
            pages: AssessmentResultService.genNewAssessmentResultPages(emptyResponses, updateAssessment.shuffle, updateAssessment.maxQuestionLimitPerPage),
            evaluator: {
                type: updateAssessment.type === AssessmentType.ClientEvaluation ? EvaluatorType.CLIENT : EvaluatorType.STUDENT,
                evaluator_id: evaluatorId,
            },
            assessment: new Types.ObjectId(updateAssessment._id),
            completed: false
        };
        if (evaluateeId) {
            filter.evaluatee = evaluateeId;
            setOnInsert.evaluatee = evaluateeId;
        }
        if (accessCode) {
            setOnInsert.evaluator!.access_code = accessCode;
        }
        let operation: AnyBulkWriteOperation<IAssessmentResult> = {
            updateOne: {
                filter: filter,
                update: {
                    $setOnInsert: setOnInsert
                },
                upsert: true,
            }
        };
        if(itemsOrShuffleChanged) {
            // mongodb set is always called after setOnInsert and cannot have overlapping fields among both.
            const withoutPages = {...setOnInsert};
            delete withoutPages.pages;
            operation = {
                updateOne: {
                    filter: filter,
                    update: {                        
                        $setOnInsert: withoutPages,
                        $set: { pages: setOnInsert.pages },
                    },
                    upsert: true,
                }
            };
        }
        return operation;
    };



    export const deleteAssessment = async (req: AuthRequest, res: Response) => {
        try {
            const { assessment_id } = req.params;

            const attemptedCount = await AssessmentResult.countDocuments({ assessment: assessment_id, startedAt: { $exists: true } }).lean();
            if (attemptedCount >= 1) {
                res.status(405).json({
                    message: `Cannot delete assessment as there ${attemptedCount === 1 ? 'is' : 'are'} ${attemptedCount} attempt${attemptedCount === 1 ? '' : 's'} in answering the assessment.\nYou may hide the assessment from public to prevent access or view results and delete all results of the assessment.`,
                    showEditAndViewResults: true
                });
                return;
            }

            await AssessmentResult.deleteMany({ assessment: assessment_id }).lean();

            const deletedAssessment = await Assessment.findByIdAndDelete(assessment_id).lean();
            if (!deletedAssessment) {
                res.status(404).json({ message: `Error deleting Assessment: Assessment id ${assessment_id} not found.` });
                return;
            }
            res.json(successResponse({}, `Assessment A${deletedAssessment?.numId}: ${deletedAssessment?.title} deleted successfully.`));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export { AssessmentController }