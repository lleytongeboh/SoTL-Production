export interface Deliverable {
    _id?: string;
    name: string;
    batch: string;
    approve: boolean;
    start_at?: Date;
    end_at?: Date;
    isPublic: boolean;
    dependsOn?: string;
}