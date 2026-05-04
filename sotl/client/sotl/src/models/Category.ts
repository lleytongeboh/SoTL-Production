export interface ICategory {
    name: string;
    belonged: any[];
    belongedCount: number;
    concatLabel?: string;
    type: 0 | 1;
    visibleMark: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}