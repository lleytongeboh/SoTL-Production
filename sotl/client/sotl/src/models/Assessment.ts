import { GridRowSelectionModel } from "@mui/x-data-grid";
import dayjs, { Dayjs } from 'dayjs';
import { IQuiz } from "./Quiz";

// 0: Self-Assessment, 1: Peer Evaluation, 2: Client Evaluation
export enum AssessmentType {
    SelfAssessment = 0,
    PeerEvaluation = 1,
    ClientEvaluation = 2,
}

export const AssessmentTypeStr = ['Self Assessment', 'Peer Evaluation', 'Client Evaluation'];

export interface IAssessment {
    _id?: string;
    numId?: number;
    type: number | string; // 0: Self-Assessment, 1: Peer Evaluation, 2: Client Evaluation
    typeLabel?: string;
    quiz_assigned: IQuiz | string | null; // Reference to the assigned quiz
    items_assigned: GridRowSelectionModel;
    batch: any | null;
    batch_assign_all: boolean;
    categories_assigned: any[];
    groups_assigned: any[];
    students_assigned: any[];
    groups_excluded: any[];
    students_excluded: any[];
    title: string;
    description: string;
    start_at: Date  | Dayjs | string | null;
    ended_at: Date | Dayjs | string | null;
    duration?: number; // Optional duration field
    public: boolean; // Indicates if the assessment is public
    shuffle: {questions: boolean, options: boolean};
    isBackNavigationAllowed: boolean;
    isPublicForReview: boolean;
    maxQuestionLimitPerPage: number | null;
}