export interface Student {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
  matric: string;
  batch: Batch[];
  loginAsBatch: string;
  marks: Mark[];
  groups: Group[];
  emailSentAt?: Date | null;
}

export type Mark = {
  _id: string;
  batch: string;
  mark_items: MarkStudentItem[];
};

export type MarkStudentItem = {
  _id: string;
  type: number;
  mark_value: number;
};

export type Group = {
  _id?: string;
  name?: string;
  description?: string;
  project?: Project;
  batch?: string;
};

export type Project = {
  _id?: string;
  title?: string;
  description?: string;
  mark_items: MarkItem[];
};

export type MarkItem = {
  _id: string;
  deliverables_type: number;
  overall_mark: number;
};

export type Batch = {
  _id: string;
  batch: string;
};

export interface BatchStudent {
  _id: string;
  batch: string;
  belonged: Student[];
  visibleMark: boolean;
  createdAt: Date;
}

export type BatchStudents = BatchStudent[];

export const initialState = [];

export type BatchPayload = {
  _id: string;
  name: string;
};
export type BatchStudentAction =
  | { type: "INIT"; payload: BatchStudents }
  | { type: "ADD_STUDENT"; payload: { student: Student; batch: BatchPayload } }
  | { type: "EDIT_STUDENT"; payload: { student: Student; batch: BatchPayload } }
  | {
      type: "DELETE_STUDENT";
      payload: { student: Student; batch: BatchPayload };
    }
  | { type: "ADD_BATCH"; payload: { BatchStudent: BatchStudent } }
  | { type: "EDIT_BATCH"; payload: { batch: BatchPayload } }
  | { type: "DELETE_BATCH"; payload: { batch: BatchPayload } }
  | { type: "TOGGLE_MARK"; payload: { batch: BatchPayload; visible: boolean } }
  | {
      type: "BULK_IMPORT_STUDENTS";
      payload: { students: Student[]; batch: BatchPayload };
    };

export type AddStudentWithPasswordPayload = {
  email: string;
  matric: string;
  batch: string;
  password: string;
};

export type AddStudentPayload = {
  email: string;
  matric: string;
  batch: string;
};

export type EditStudentPayload = {
  name?: string;
  email?: string;
  batches?: string[];
  matric?: string;
  password?: string;
};

export type AddClientPayload = {
  name: string;
  designation: string;
  company: string;
  batch: string;
  email: string;
  projectId: string;
};

export type EditClientPayload = {
  name: string;
  designation: string;
  email: string;
  company: string;
  projectId: string;
};

export type StudentLogProps = {
  _id: string;
  jobId: string;
  jobContent: string;
  type: number;
  batch: string;
  status: string;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ExtendedStudentLogProps extends StudentLogProps {
  no: number;
}

type ClientProjectProps = {
  _id: string;
  title: string;
};

export type ClientProps = {
  _id: string;
  name: string;
  designation: string;
  batch: string;
  company: string;
  role: string;
  email: string;
  project: ClientProjectProps;
  created_at: Date;
  groupName: string;
};

export interface ClientStateProps extends ClientProps {
  no: number;
}

type GroupProjectProps = {
  _id: string;
  title: string;
};

export type GroupProject = {
  _id: string;
  name: string;
  batch: string;
  project: GroupProjectProps;
};

type ClientGroupProps = {
  _id: string;
  name: string;
};

export interface ClientIdentityProps {
  _id: string;
  name: string;
  designation: string;
  batch: string;
  company: string;
  role: string;
  email: string;
  project: ClientProjectProps;
  created_at: Date;
  group: ClientGroupProps;
}

export interface StudentFromLecturerViewProps {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
  matric: string;
  lastLogin: Date | null;
  batch: Batch[];
  loginAsBatch: string;
  groups: GroupLecturerView[];
  emailSentAt?: Date | null;
}

export type GroupLecturerView = {
  _id?: string;
  name?: string;
  description?: string;
  project?: ProjectLecturerView;
  batch?: string;
};

export type ProjectLecturerView = {
  _id?: string;
  title?: string;
  description?: string;
  mark: string;
};

export type RemoveStudentPayload = {
  batch: string;
  confirmDelete: boolean;
};

export type SelfAssessmentResult = {
  _id: string;
  assessmentId: string;
  assessmentName: string;
  startedAt: Date;
  endedAt: Date;
  point: string;
  score: string;
  correct: string;
};

export type PeerAssessmentResult = {
  as_id: string;
  asr_id: string;
  endedAt: Date;
  evaluator: {
    _id: string;
    name: string;
    accessCode: string;
  };
  score: number;
  totalScore: number;
};