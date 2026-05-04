export interface StudentMarkItem {
    type: number;
    mark_value: number;
}

export interface TeamMember {
    name?: string;
    email?: string;
    student_id?: string;
    group_role?: string;
    project_role?: string[];
    matric?: string;
}

export interface Group {
    _id?: string;
    name: string;
    description?: string;
    team_members: TeamMember[];
    leader?: string;
    project?: string;
    batch?: string;
}