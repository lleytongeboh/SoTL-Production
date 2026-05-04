import { Project } from './Project';

export interface Group {
    _id: string;
    name: string;
    description: string;
    team_members: any[];
    team_members_count?: string;
    batch: string;
    project: string | Project;
}