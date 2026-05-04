import Student from "../models/Student";
import Client from "../models/Client";
import mongoose, { ClientSession } from "mongoose";
import connectDB from "../database";
import Badge from "../models/Badge";
import Group from "../models/Group";
import Category from "../models/Category";
import Deliverables from "../models/Deliverables";
import Project from "../models/Project";
import _ from "lodash";
import * as fs from "fs";
import * as path from "path";

const getBatchStudents = async () => {
  await connectDB(); // Ensure the database is connected
  const result = await Student.aggregate([
    {
      $match: {
        role: "student",
      },
    },
    {
      $lookup: {
        from: "groups",
        localField: "_id",
        foreignField: "team_members.student_id",
        as: "groups",
      },
    },
    {
      $unwind: {
        path: "$groups",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "groups.project",
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
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        groups: {
          _id: "$groups._id",
          name: "$groups.name",
          description: "$groups.description",
          batch: "$groups.batch",
          project: "$project",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        email: { $first: "$email" },
        groups: {
          $push: {
            _id: "$groups._id",
            name: "$groups.name",
            description: "$groups.description",
            batch: "$groups.batch",
            project: "$groups.project",
          },
        },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "belonged",
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
        name: { $first: "$categories.name" },
        description: { $first: "$categories.description" },
        type: { $first: "$categories.type" },
        students: {
          $push: {
            _id: "$_id",
            name: "$name",
            email: "$email",
            groups: "$groups",
          },
        },
      },
    },
    {
      $match: {
        type: 0,
      },
    },
  ]);

  console.log(JSON.stringify(result));
  await mongoose.connection.close();
  process.exit(0);
};

const getClientwithGroupProject = async () => {
  await connectDB();
  const result = await Client.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId("670d4c13c3cae268c966f202"),
      }, // Match the specific client
    },
    {
      $lookup: {
        from: "projects",
        // The name of the collection in MongoDB
        localField: "project",
        // The field from Client that references Project
        foreignField: "_id",
        // The field in Project that matches the Client's project
        as: "project", // Name of the output array
      },
    },
    {
      $unwind: {
        path: "$project",
        // Flatten the array for easier access
        preserveNullAndEmptyArrays: true, // Keep clients without projects
      },
    },
    {
      $lookup:
        /**
         * from: The target collection.
         * localField: The local join field.
         * foreignField: The target join field.
         * as: The name for the results.
         * pipeline: Optional pipeline to run on the foreign collection.
         * let: Optional variables to use in the pipeline field stages.
         */
        {
          from: "groups",
          localField: "project._id",
          foreignField: "project",
          as: "group",
        },
    },
    {
      $unwind:
        /**
         * path: Path to the array field.
         * includeArrayIndex: Optional name for index.
         * preserveNullAndEmptyArrays: Optional
         *   toggle to unwind null and empty values.
         */
        {
          path: "$group",
          preserveNullAndEmptyArrays: true,
        },
    },
    {
      $unwind:
        /**
         * path: Path to the array field.
         * includeArrayIndex: Optional name for index.
         * preserveNullAndEmptyArrays: Optional
         *   toggle to unwind null and empty values.
         */
        {
          path: "$group.team_members",
          preserveNullAndEmptyArrays: true,
        },
    },
    {
      $match:
        /**
         * query: The query in MQL.
         */
        {
          "group.team_members.group_role": "Leader",
        },
    },
    {
      $lookup:
        /**
         * from: The target collection.
         * localField: The local join field.
         * foreignField: The target join field.
         * as: The name for the results.
         * pipeline: Optional pipeline to run on the foreign collection.
         * let: Optional variables to use in the pipeline field stages.
         */
        {
          from: "users",
          localField: "group.team_members.student_id",
          foreignField: "_id",
          as: "group.leader",
        },
    },
    {
      $unwind:
        /**
         * path: Path to the array field.
         * includeArrayIndex: Optional name for index.
         * preserveNullAndEmptyArrays: Optional
         *   toggle to unwind null and empty values.
         */
        {
          path: "$group.leader",
          preserveNullAndEmptyArrays: true,
        },
    },
    {
      $project: {
        name: 1,
        designation: 1,
        company: 1,
        email: 1,
        project: {
          _id: "$project._id",
          projectName: "$project.name",
        },
        group: {
          name: "$group.name",
          leader: {
            _id: "$group.leader._id",
            name: "$group.leader.name",
            email: "$group.leader.email",
          },
        },
      },
    },
  ]);
  console.log(JSON.stringify(result));
  await mongoose.connection.close();
  process.exit(0);
};
//getBatchStudents();
// getClientwithGroupProject();

const getStudentByIdWithGroupProject = async (studentId: string) => {
  await connectDB();
  try {
    const result = await Student.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(studentId),
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "_id",
          foreignField: "team_members.student_id",
          as: "groups",
        },
      },
      {
        $unwind: {
          path: "$groups",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "groups.project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind:
          /**
           * path: Path to the array field.
           * includeArrayIndex: Optional name for index.
           * preserveNullAndEmptyArrays: Optional
           *   toggle to unwind null and empty values.
           */
          {
            path: "$project",
            preserveNullAndEmptyArrays: true,
          },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          created_at: 1,
          matricNumber: 1,
          batch: 1,
          loginAsBatch: 1,
          mark: 1,
          groups: {
            _id: "$groups._id",
            name: "$groups.name",
            description: "$groups.description",
            batch: "$groups.batch",
            project: {
              _id: "$project._id",
              title: "$project.title",
              description: "$project.description",
            },
          },
        },
      },
      {
        $group:
          /**
           * _id: The id of the group.
           * fieldN: The first field name.
           */
          {
            _id: "$_id",
            name: {
              $first: "$name",
            },
            email: {
              $first: "$email",
            },
            createdAt: {
              $first: "$created_at",
            },
            matric: {
              $first: "$matricNumber",
            },
            batch: {
              $first: "$batch",
            },
            loginAsBatch: {
              $first: "$loginAsBatch",
            },
            marks: {
              $first: "$mark",
            },
            groups: {
              $push: {
                _id: "$groups._id",
                name: "$groups.name",
                description: "$groups.description",
                batch: "$groups.batch",
                project: "$groups.project",
              },
            },
          },
      },
    ]);
    if (result.length === 0) {
      throw new Error("Student not found");
    }
    console.log(JSON.stringify(result));
  } catch (err: any) {
    throw new Error(
      `Failed to get student by id with group project: ${err.message}`
    );
  }
};

const createStudent = async () => {
  await connectDB();
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Begin transaction
  let student = null;
  try {
    const studentCreated = await Student.create(
      [
        {
          name: "Anonymous",
          email: "aaaa@gmail.com",
          role: "student",
          matricNumber: "123456",
          batch: [{ batch: "24/25" }],
          point: 0,
          created_at: new Date(),
          password: "123456789",
        },
      ],
      { session }
    );
    await session.commitTransaction();
    student = studentCreated[0]._id;
    console.log(`Student x: ${studentCreated}`);
    console.log(`Student created: ${student}`);
  } catch (err: any) {
    await session.abortTransaction();
    throw new Error(`Failed to create student: ${err.message}`);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

const tst = async () => {
  await connectDB();
  try {
    const badgesGrouped = await Badge.aggregate([
      {
        $group: {
          _id: "$batch",
          badges: {
            $push: {
              _id: "$_id",
              deliverable_completion: "$deliverable_completion",
            },
          },
        },
      },
    ]);

    // Transform the array to the desired object format
    const formattedResult = badgesGrouped.reduce((acc, curr) => {
      acc[curr._id] = curr.badges;
      return acc;
    }, {});
    console.log("formattedResult", JSON.stringify(formattedResult));
  } catch (error: any) {
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

const updateProjectBadge = async (project_id: mongoose.Types.ObjectId) => {
  await connectDB();
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction({ readPreference: "primary" });
  try {
    const project = await Project.findById(project_id)
      .session(session)
      .read("primary");
    if (!project) {
      throw new Error("Project not found");
    }
    const projectDeliverableIds = project.deliverables.map(
      (deliverable: any) => deliverable.deliverable_id
    );

    const projectBadge = await Badge.find({
      deliverable_completion: {
        $in: projectDeliverableIds,
      },
    })
      .sort({ _id: 1 })
      .session(session)
      .read("primary");

    project.badges = [...projectBadge.map((badge: any) => badge._id)];
    // console.log(`Project badges updated:`, project);

    const x = await project.save({ session });

    await session.commitTransaction();

    /*  console.log('xxx')
    console.log(`xx:`, x); */
    console.log(`xx:`, x);
    //return project;
  } catch (error: any) {
    await session.abortTransaction();
    throw new Error(error.message);
  } finally {
    session.endSession();
    await mongoose.connection.close();

    // process.exit(0);
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
    await connectDB();
    const category = await Category.find({ type: 0 }, "name visibleMark");
    const deliverables = await Deliverables.find({});
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

    result.splice(1);
    console.log("result:" + JSON.stringify(result));
    const results = result.map((r: any) => {
      const response: LeaderBoardResponseProps = {
        _id: r._id,
        name: r.name,
        matric: r.matric,
        mark: "-",
        group: {
          name: r.group.name,
          batch: r.group.batch,
          project: {}
        },
      };

      let studentMark = 0;
      let hadStudentMark = false;
      
      // assign title to response
      if(r.group.project && r.group.project.title){
        if(response.group.project === undefined){
          console.log('xx')
          response.group.project = {};
        }
        response.group.project ={
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
          });
        }
        if(response.group.project === undefined){
          console.log('xx')
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
    writeJsonToFile("leaderboard.json", JSON.stringify(results));
  } catch (error: any) {
    console.log(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
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
    let submit = filteredDeliverablesWithoutRejected.some((d: any) =>
      _.isEqual(d.deliverable_id, copyDeliverables[i]._id)
    );
    if (submit) {
      totalSubmitted++;
    }
  }

  return ((totalSubmitted / totalDeliverables) * 100).toFixed(2);
};

const writeJsonToFile = (fileName: string, data: string) => {
  // Construct the full path to the `public` folder
  const publicPath = path.join(__dirname, "public");

  // Ensure the public directory exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath); // Create the folder if it doesn't exist
  }

  // Construct the full path for the file
  const filePath = path.join(publicPath, fileName);

  // Convert the JSON object to a string with formatting

  // Write the JSON string to the file
  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return;
    }
    console.log(`JSON data successfully written to ${filePath}`);
  });
};

//updateProjectBadge(new mongoose.Types.ObjectId("67288b554128a5b927838935"));
//tst();
// createStudent();
// getStudentByIdWithGroupProject('671b6592ce80745c3aa1a24a');
/* 
const deliverableData = [
  {
    _id: '123456'
  },
  {
    _id: '234567'
  },
  {
    _id: '345678'
  },
  {
    _id: '456789'
  }
];

const deliverableSubmittedData = [
  {
    deliverable_id: '123456',
    status: 2
  },
  {
    deliverable_id: '234567',
    status: 1
  },
  {
    deliverable_id: '345678',
  },
  {
    deliverable_id: '456789',
    status: 2
  }
]; */

/* console.log(calculateProgress(deliverableData, deliverableSubmittedData)); // 50 */

getLeaderboardData();
