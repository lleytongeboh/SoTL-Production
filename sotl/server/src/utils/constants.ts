export interface MarkingScheme {
    topic: string;
    deliverable_type: number;
    deliverable: string;
    total_mark: number;
    weightage: number;
}

export const PROJECT_MARKING_SCHEME : MarkingScheme[] = [
    {
        topic: 'Proposal',
        deliverable_type: 1,
        deliverable: 'Document Structure & Content',
        total_mark: 10,
        weightage: 5
    },
    {
        topic: 'Proposal',
        deliverable_type: 2,
        deliverable: 'Oral Presentation & Time Management',
        total_mark: 10,
        weightage: 5
    },
    {
        topic: 'Project Requirement Specification',
        deliverable_type: 3,
        deliverable: 'Presentation on Software Requirement Specification',
        total_mark: 15,
        weightage: 15
    },
    {
        topic: 'Project Evaluation',
        deliverable_type: 4,
        deliverable: 'Requirement & Design Document',
        total_mark: 15,
        weightage: 15
    },
    {
        topic: 'Project Evaluation',
        deliverable_type: 5,
        deliverable: 'Implementation',
        total_mark: 10,
        weightage: 10
    },
    {
        topic: 'Presentation',
        deliverable_type: 6,
        deliverable: 'Slide Presentation & Responsive',
        total_mark: 10,
        weightage: 5
    },
    {
        topic: 'Presentation',
        deliverable_type: 7,
        deliverable: 'Oral Presentation & Time Management',
        total_mark: 10,
        weightage: 5
    },
    {
        topic: 'Testing and Release',
        deliverable_type: 8,
        deliverable: 'Testing',
        total_mark: 10,
        weightage: 5
    },
    {
        topic: 'Testing and Release',
        deliverable_type: 9,
        deliverable: 'System Demo / Release',
        total_mark: 10,
        weightage: 5
    }
]; 

export const STUDENT_MARKING_SCHEME : MarkingScheme[] = [
    {
        topic: 'Peer / Individual Evaluation',
        deliverable_type: 1,
        deliverable: 'Peer / Individual Evaluation',
        total_mark: 50,
        weightage: 10
    },
    {
        topic: 'Team Evaluation',
        deliverable_type: 2,
        deliverable: 'Team Evaluation',
        total_mark: 50,
        weightage: 10
    },
    {
        topic: 'Project Evaluation',
        deliverable_type: 3,
        deliverable: 'Project Evaluation',
        total_mark: 50,
        weightage: 10
    }
];

export const MS_PER_MINUTE = 60000; // number of milliseconds per minute
export const ASSESSMENT_SUBMISSION_GRACE_PERIOD_IN_MINUTES = 2;
export const AUTO_END_AND_MARK_ASSESSMENT_JOB_REPEAT_INTERVAL_IN_MINUTES = 5; // repeat interval to automatically end and mark student assessments if not submitted