export type DeliverableCompletion = {
  _id: string;
  name: string;
};

export type Badge = {
  _id: string;
  order: number;
  name: string;
  color: string;
  batch: string;
  description: string;
  deliverableCompletion: DeliverableCompletion[];
};

export type BadgeList = {
  _id: string;
  batch: string;
  studentNumber: number;
  badges: Badge[];
};

export type DeliverableItem = {
  _id: string;
  name: string;
  batch: string;
};

export type Deliverable = {
  _id: string;
  name: string;
  deliverables: DeliverableItem[];
};

export type EditBadgePayload = {
  name?: string;
  color?: string;
  description?: string;
  deliverableCompletion?: string[];
};

export type BadgeCreated = {
  name: string;
  color: string;
  batch: string;
  description: string;
  deliverableCompletion: string[];
};

export type EditBadgeOrderingRemovePayload = {
  batch: string;
  badges: BadgesOrdering[];
};

export type BadgesOrdering = {
  _id: string;
  order: number;
};

export type BadgeProps = {
  _id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  batch: string;
};

export type LeaderboardProps = {
  _id: string;
  name: string;
  matric: string;
  mark: string;
  point: number;
  group: GroupProps;
};

export type GroupProps = {
  name: string;
  batch: string;
  project?: {
    title: string;
    badges: BadgeProps[];
    progress: string;
    mark: string;
  };
};

export type GroupLeaderboardProps = {
  no: number;
  name: string;
  projectName: string;
  batch: string;
  badges: BadgeProps[];
  mark: string;
  progress: string;
  uuid: string;
}