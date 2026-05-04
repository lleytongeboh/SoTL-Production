import { Moment } from "moment";

export interface Deliverable {
    _id?: string;
    name: string;
    file_path_uri: string;
    created_at: Date;
    type: number;
    status: number;
    comment?: string;
    deliverable_id: string;
}

export interface MarkItem {
    deliverables_type: number;
    overall_mark: number;
}

export interface Project {
    _id?: string;
    title: string;
    description: string;
    deliverables?: Deliverable[];
    mark_items?: MarkItem[];
    to_do_list?: string[];
    sprint_list?: string[];
    group_name?: string;
    group_id?: string;
    batch?: string;
    marked?: boolean;
    overall_mark?: number;
    badges?: string[];
}

export interface ToDoList {
    _id?: string;
    tasks: string[];
    task_content: TaskContent;
    sprint: string;
}

export interface Sprint {
    _id?: string;
    todoList: string[];
    task_content: TaskContent;
}

export interface TaskContent {
    _id?: string;
    creator: string;
    assignee?: string;
    title: string;
    description?: string;
    status: number;
    priority?: number;
    created_at?: Moment;
    updated_at?: Moment;
    completed_at?: Moment;
    sprint?: string;
    comments?: Comment[];
    wrapper_id?: string;
    progress?: number;
}

export interface Comment {
    _id?: string;
    content: string;
    created_at: Moment;
    updated_at: Moment;
    user: string;
    user_id: string;
}