import Badge from "../models/Badge";
import Category from "../models/Category";
import Project from "../models/Project";
import Deliverables from "../models/Deliverables";
import Group from "../models/Group";
import mongoose, { ClientSession, Types } from "mongoose";
import _ from "lodash";
import { AssessmentResultService } from "./AssessmentResultService";
import { createNewNotification } from "./NotificationService";

export const getBatchListWithBadge = async () => {
  try {
    const badgeList = await Badge.aggregate([
      {
        $lookup: {
          from: "deliverables",
          localField: "deliverable_completion",
          foreignField: "_id",
          as: "deliverable_completion",
        },
      },
      {
        $unwind: {
          path: "$deliverable_completion",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          color: 1,
          order: 1,
          batch: 1,
          deliverable_completion: {
            _id: "$deliverable_completion._id",
            name: "$deliverable_completion.name",
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: {
            $first: "$name",
          },
          batch: {
            $first: "$batch",
          },
          color: {
            $first: "$color",
          },
          order: {
            $first: "$order",
          },
          description: {
            $first: "$description",
          },
          deliverableCompletion: {
            $push: {
              _id: "$deliverable_completion._id",
              name: "$deliverable_completion.name",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          batch: 1,
          color: 1,
          order: 1,
          description: 1,
          deliverableCompletion: {
            $sortArray: {
              input: "$deliverableCompletion",
              sortBy: {
                _id: 1,
              }, // Sort deliverableCompletion array by _id in ascending order
            },
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "batch",
          foreignField: "name",
          as: "categories",
        },
      },
      {
        $unwind: {
          path: "$categories",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$categories._id",
          batch: {
            $first: "$batch",
          },
          studentNumber: {
            $first: "$categories.belonged",
          },
          badges: {
            $push: {
              _id: "$_id",
              order: "$order",
              name: "$name",
              color: "$color",
              batch: "$batch",
              description: "$description",
              deliverableCompletion: "$deliverableCompletion",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          batch: 1,
          studentNumber: {
            $sum: {
              $size: "$studentNumber",
            },
          },
          badges: {
            $sortArray: {
              input: "$badges",
              sortBy: {
                order: 1,
              },
            },
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    return badgeList;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getBatchListWithoutBadge = async () => {
  try {
    const result = await Category.aggregate([
      {
        $match: {
          type: 0,
        },
      },
      {
        $lookup: {
          from: "badges",
          localField: "name",
          foreignField: "batch",
          as: "badges",
        },
      },
      {
        $match: {
          badges: {
            $size: 0,
          },
        },
      },
      {
        $project: {
          _id: "$_id",
          batch: "$name",
          studentNumber: {
            $size: "$belonged",
          },
          badges: "$badges",
        },
      },
    ]);
    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getBatchListWithAndWithoutBadge = async () => {
  try {
    const batchListWithBadge = await getBatchListWithBadge();
    const batchListWithoutBadge = await getBatchListWithoutBadge();
    return [...batchListWithBadge, ...batchListWithoutBadge];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getBadge = async (id: string) => {
  try {
    const badge = await Badge.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "deliverables",
          localField: "deliverable_completion",
          foreignField: "_id",
          as: "deliverable_completion",
        },
      },
      {
        $unwind: {
          path: "$deliverable_completion",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          color: 1,
          order: 1,
          batch: 1,
          deliverable_completion: {
            _id: "$deliverable_completion._id",
            name: "$deliverable_completion.name",
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: {
            $first: "$name",
          },
          batch: {
            $first: "$batch",
          },
          color: {
            $first: "$color",
          },
          order: {
            $first: "$order",
          },
          description: {
            $first: "$description",
          },
          deliverableCompletion: {
            $push: {
              _id: "$deliverable_completion._id",
              name: "$deliverable_completion.name",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          batch: 1,
          color: 1,
          order: 1,
          description: 1,
          deliverableCompletion: {
            $sortArray: {
              input: "$deliverableCompletion",
              sortBy: {
                _id: 1,
              }, // Sort deliverableCompletion array by _id in ascending order
            },
          },
        },
      },
    ]);
    return badge[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateProjectBadge = async (
  project_id: mongoose.Types.ObjectId
) => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction({ readPreference: "primary" });
  try {
    const project = await Project.findById(project_id)
      .session(session)
      .read("primary");
    if (!project) {
      throw new Error("Project not found");
    }
    const group = await Group.findOne({ project: project_id });
    const deliverables = await Deliverables.find({ batch: group!.batch });
    const projectDeliverableIds = project.deliverables.reduce(
      (prev, cur) => {
        const d = deliverables.find(e => e.id == cur.deliverable_id);
        if (d === undefined) {
          throw new Error("Deliverable not found");
        }
        (!d.approve || cur.status === 1) ? prev.push(cur.deliverable_id) : null;
        return prev;
      }, [] as any[]);
    const existingBadge = project.badges ?? [];
    const projectBadge = await Badge.find({
      deliverable_completion: {
        $not: {
          $elemMatch: {
            $nin: projectDeliverableIds,
          },
        },
        $ne: [],
      },
    })
      .sort({ _id: 1 })
      .session(session)
      .read("primary");

    project.badges = [...projectBadge.map((badge: any) => badge._id)];
    if (!_.isEqual(existingBadge, project.badges)) {
      const { newBadge, removedBadge }: { newBadge: Types.ObjectId[], removedBadge: Types.ObjectId[] } = [...existingBadge, ...project.badges]
        .reduce((prev, cur) => {
          if (!existingBadge.includes(cur)) {
            prev.newBadge.push(cur);
          } else if (!(project.badges ?? []).includes(cur)) {
            prev.removedBadge.push(cur);
          }
          return prev;
        },
          { newBadge: [], removedBadge: [] } as { newBadge: Types.ObjectId[], removedBadge: Types.ObjectId[] });
      await Promise.all(newBadge.map(async b => {
        const badge = await Badge.findById(b);
        await createNewNotification({ message: `Congratulation, your group have received ${badge?.name} badge. Keep going!`, type: "info", group: group?.id });
      }));
      await Promise.all(removedBadge.map(async b => {
        const badge = await Badge.findById(b);
        await createNewNotification({ message: `Your ${badge?.name} badge has been removed from the ${group?.name} group.`, type: "info", group: group?.id });
      }));
    }
    const result = await project.save({ session });
    await session.commitTransaction();

    return result;
  } catch (error: any) {
    await session.abortTransaction();
    throw new Error(error.message);
  } finally {
    session.endSession();
  }
};

type BadgeProps = {
  _id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  batch: string;
};

type LeaderBoardResponseProps = {
  _id: string;
  name: string;
  matric: string;
  mark: string;
  point?: number;
  group: {
    name: string;
    batch: string;
    project?: {
      title?: string;
      badges?: BadgeProps[];
      progress?: string;
      mark?: string;
    };
  };
};


export const getLeaderboardData = async () => {
  try {
    const category = await Category.find({ type: 0 }, "name visibleMark");
    const deliverables = await Deliverables.find({});
    const studentTotalReward = await AssessmentResultService.getStudentTotalRewardWithBatch();
    const studentRewardMap = new Map<string, number>();

    for (const student of studentTotalReward) {
      if (student.totalRewards !== undefined && student.batch !== undefined && student.totalRewards['0'] !== undefined) {
        if (studentRewardMap.has(`${student._id}:${student.batch}`)) {
          studentRewardMap.set(`${student._id}:${student.batch}`, studentRewardMap.get(`${student._id}:${student.batch}`) + student.totalRewards['0']);
        } else {
          studentRewardMap.set(`${student._id}:${student.batch}`, student.totalRewards['0']);
        }
      }
    };

    const result = await Group.aggregate([
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "badges",
          localField: "project.badges",
          foreignField: "_id",
          as: "project.badges",
        },
      },
      {
        $unwind: {
          path: "$team_members",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "team_members.student_id",
          foreignField: "_id",
          as: "team_member",
        },
      },
      {
        $unwind: {
          path: "$team_member",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: "$team_member._id",
          name: "$team_member.name",
          matric: "$team_member.matricNumber",
          mark: "$team_member.mark",
          group: {
            name: "$name",
            batch: "$batch",
            project: {
              title: "$project.title",
              badge: "$project.badges",
              deliverables: "$project.deliverables",
              mark_items: "$project.mark_items",
            },
          },
        },
      },
    ]);

    return result.map((r: any) => {
      const response: LeaderBoardResponseProps = {
        _id: r._id,
        name: r.name,
        matric: r.matric,
        mark: "-",
        point: studentRewardMap.get(`${r._id}:${r.group.batch}`) || 0,
        group: {
          name: r.group.name,
          batch: r.group.batch,
          project: {}
        },
      };

      let studentMark = 0;
      let hadStudentMark = false;

      // assign title to response
      if (r.group.project && r.group.project.title) {
        if (response.group.project === undefined) {
          response.group.project = {};
        }
        response.group.project = {
          ...response.group.project,
          title: r.group.project.title
        }
      }

      if (
        category &&
        category.find((c: any) => c.name === r.group.batch)?.visibleMark
      ) {
        if (r.mark.length > 0 && r.group.batch !== undefined) {
          const markItemsWithBatch = r.mark.find(
            (m: any) => m.batch === r.group.batch
          );
          if (markItemsWithBatch !== undefined) {
            studentMark = markItemsWithBatch.mark_items.reduce(
              (acc: number, markItem: any) => {
                hadStudentMark = true;
                return acc + markItem.mark_value / 5;
              },
              0
            );
          }
        }
        let projectMark = 0;
        let hadProjectMark = false;
        if (r.group.project) {
          if (r.group.project.mark_items.length > 0) {
            projectMark = r.group.project.mark_items.reduce(
              (x: number, y: any) => {
                let accMark = 0;
                switch (y.deliverables_type) {
                  case 1:
                    hadProjectMark = true;
                    accMark = y.overall_mark / 2;
                    break;
                  case 2:
                    hadProjectMark = true;
                    accMark = y.overall_mark / 2;
                    break;
                  case 3:
                    hadProjectMark = true;
                    accMark = y.overall_mark;
                    break;
                  case 4:
                    hadProjectMark = true;
                    accMark = y.overall_mark;
                    break;
                  case 5:
                    hadProjectMark = true;
                    accMark = y.overall_mark;
                    break;
                  case 6:
                    hadProjectMark = true;
                    accMark = y.overall_mark / 2;
                    break;
                  case 7:
                    hadProjectMark = true;
                    accMark = y.overall_mark / 2;
                    break;
                  case 8:
                    hadProjectMark = true;
                    accMark = y.overall_mark / 2;
                    break;
                  case 9:
                    hadProjectMark = true;
                    accMark = y.overall_mark / 2;
                    break;
                  default:
                    break;
                }
                return x + accMark;
              },
              0
            );
          }
          response.group.project = {
            ...response.group.project,
            mark: !hadProjectMark ? "-" : `${projectMark}`,
          };
        }

        response.mark =
          hadProjectMark || hadStudentMark
            ? `${studentMark + projectMark}`
            : "-";
      } else {
        response.mark = "N/A";
      }

      // Assign badge
      let badgeResponse = [];
      // format project badges
      if (r.group.project && r.group.project.badge.length > 0) {
        if (r.group.project.badge.length > 0) {
          badgeResponse = r.group.project.badge.map((badge: any) => {
            return {
              _id: badge._id,
              name: badge.name,
              description: badge.description,
              color: badge.color,
              order: badge.order,
              batch: badge.batch,
            };
          })
          .sort((a: { order: number; }, b: { order: number; }) => a.order - b.order);
        }
        if (response.group.project === undefined) {
          response.group.project = {};
        }
        response.group.project.badges = badgeResponse;
        response.group.project = {
          ...response.group.project,
          badges: badgeResponse,
        };
      }

      // Calculate the progress of the student
      if (r.group.project && r.group.project.deliverables !== undefined) {
        const deliverableSelected = deliverables.filter(
          (x: any) => x.batch === r.group.batch
        );
        const progressCalculated = calculateProgress(
          deliverableSelected,
          r.group.project.deliverables !== undefined
            ? r.group.project.deliverables
            : []
        );

        response.group.project = {
          ...response.group.project,
          progress: progressCalculated === null ? "-" : `${progressCalculated}`,
        };
      }

      return response;
    });

  } catch (error: any) {
    console.log(error);
  }
};

// This method assume deliverables are passed in according to the batch of deliverableSubmitted
const calculateProgress = (
  deliverables: any[],
  deliverableSubmitted: any[]
) => {
  if (deliverables.length === 0) {
    return null;
  }
  let totalDeliverables = deliverables.length;
  if (deliverableSubmitted.length === 0) {
    return -1;
  }
  let totalSubmitted = 0;
  const copyDeliverables = _.cloneDeep(deliverables);
  const copyDeliverableSubmitted = _.cloneDeep(deliverableSubmitted);

  const filteredDeliverablesWithoutRejected = copyDeliverableSubmitted.filter(
    (d: any) => {
      if (d.status !== undefined) {
        return d.status === 1;
      } else {
        return d;
      }
    }
  );

  for (let i = 0; i < copyDeliverables.length; i++) {
    let submit = filteredDeliverablesWithoutRejected.some(
      (d: any) => _.isEqual(d.deliverable_id, copyDeliverables[i]._id)
    );
    if (submit) {
      totalSubmitted++;
    }
  }

  return ((totalSubmitted / totalDeliverables) * 100).toFixed(2);
};

export const updateBatchNameOnBadges = async  (oldBatch: string, newBatch: string, session: ClientSession) => {
  try {
    await Badge.updateMany(
      { batch: oldBatch },
      { $set: { batch: newBatch } },
      { session }
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};