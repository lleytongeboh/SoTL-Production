import { AssessmentType } from "./Assessment";

// 0 - multi-choice, 1 - likert scale, 2 - open-ended
export enum QuestionType {
    MCQ = 0,
    LIKERT = 1,
    OEQ = 2,
}

export enum RewardType {
    POINT = 0,
    SCORE = 1
}

export interface QuestionItem {
    correctAnswer?: boolean;
    _id?: string;
    label: string;
}

type RewardValue = number | string;

export interface IQuestion {
    type: QuestionType;
    _id?: string;
    tempId?: number;
    // topic?: string;
    title: string;
    // description: string;
    options: QuestionItem[];
    rewards?: { [key in RewardType as `${key}`]: RewardValue };
    required: boolean;
    multiline: boolean;
    isQuestion: boolean;
}

export interface MCQ extends IQuestion {
    type: QuestionType.MCQ;
    answer?: number; // Optional field for multiple-choice questions
}

export interface OEQ extends IQuestion {
    type: QuestionType.OEQ;
    op_answer?: string;
}

export interface LikertScale extends IQuestion {
    type: QuestionType.LIKERT;
    likert_statements: { _id?: string, label: string }[];
}

export type Question = MCQ | OEQ | LikertScale;

export interface IQuiz {
    _id?: string;
    numId?: number;
    type: AssessmentType | ''; // 0 - individual assessment, 1 - Peer Evaluation, 2 - Group Evaluation
    title: string;
    description: string;
    /* items?: {
        [propname: string]: (
        | MCQ
        | LikertScale
        | OEQ)
    }; */
    items: Question[];
    itemsUsedInAssessment?: any;
    itemCount?: number;
    questionCount?: number;
    rewards: {
        [key in RewardType as `${key}`]: boolean
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface QuizItem {
    _id: string;
    type: number; // 0 - individual assessment, 1 - Peer Evaluation, 2 - Group Evaluation
    title: string;
    description: string;
    questionCount: number;
}