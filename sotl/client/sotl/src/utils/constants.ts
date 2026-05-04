export const PROJECT_ROLES : string[] = [
    'Implementation Manager',
    'Planning Manager',
    'Quality Manager',
    'Customer Interface Manager',
    'Support Manager',
    'Process Manager',
    'Test Manager',
];

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

export enum COLORS {
    Black = "#000000",
    White = "#FFFFFF",
    Gray = "#808080",
    Silver = "#C0C0C0",
    Red = "#FF0000",
    Maroon = "#800000",
    Yellow = "#FFFF00",
    Olive = "#808000",
    Lime = "#00FF00",
    Green = "#008000",
    Aqua = "#00FFFF",
    Teal = "#008080",
    Blue = "#0000FF",
    Navy = "#000080",
    Fuchsia = "#FF00FF",
    Purple = "#800080",
    Orange = "#FFA500",
    Brown = "#A52A2A",
    Gold = "#FFD700",
    Coral = "#FF7F50",
    Salmon = "#FA8072",
    Indigo = "#4B0082",
    Violet = "#EE82EE",
    Lavender = "#E6E6FA",
    Pink = "#FFC0CB",
    Chocolate = "#D2691E",
    Crimson = "#DC143C",
    Cyan = "#00FFFF",
    Magenta = "#FF00FF",
  }