import Student from "../models/Student";
import Client from "../models/Client";
import Lecturer from "../models/Lecturer";
import Category from "../models/Category";
import Group from "../models/Group";
import mongoose, { ClientSession } from "mongoose";
import * as EmailService from "./EmailService";
import { hashPassword } from "../utils/methods/password_hashing";
import { generateRandomPassword } from "../utils/methods";
import { AssessmentService } from "./AssessmentService";
import { AssessmentResultService } from "./AssessmentResultService";

type studentDataType = {
  email: string;
  matric: string;
  batch: string;
};

export const getAllBatchStudents = async () => {
  try {
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
          created_at: 1,
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
              mark_items: "$project.mark_items",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          email: { $first: "$email" },
          createdAt: { $first: "$created_at" },
          marks: { $first: "$mark" },
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
          batch: { $first: "$categories.name" },
          type: { $first: "$categories.type" },
          visibleMark: { $first: "$categories.visibleMark" },
          createdAt: { $first: "$categories.createdAt" },
          belonged: {
            $push: {
              _id: "$_id",
              name: "$name",
              email: "$email",
              mark: "$marks",
              createdAt: "$createdAt",
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

    const categoryWithoutStudent = await Category.find({
      type: 0,
      belonged: { $size: 0 }, // Checks if the length of the array is 0
    });

    if (categoryWithoutStudent.length > 0) {
      for (const c of categoryWithoutStudent) {
        result.push({
          _id: c._id,
          batch: c.name,
          type: c.type,
          visibleMark: c.visibleMark,
          createdAt: c.createdAt,
          belonged: c.belonged,
        });
      }
    }

    return result;
  } catch (err: any) {
    throw new Error(`Failed to get all batch student: ${err.message}`);
  }
};

export const getStudentByIdWithGroupProject = async (studentId: string) => {
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
          created_at: 1,
          matricNumber: 1,
          batch: 1,
          loginAsBatch: 1,
          mark: 1,
          lastLogin: 1,
          groups: {
            _id: "$groups._id",
            name: "$groups.name",
            description: "$groups.description",
            batch: "$groups.batch",
            project: {
              _id: "$project._id",
              title: "$project.title",
              description: "$project.description",
              mark_items: "$project.mark_items",
            },
          },
        },
      },
      {
        $group: {
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
          lastLogin: {
            $first: "$lastLogin",
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
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "userId",
          as: "jobs",
        },
      },
      {
        $addFields: {
          latestJob: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: "$jobs",
                  sortBy: {
                    updatedAt: -1,
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          createdAt: 1,
          matric: 1,
          batch: 1,
          loginAsBatch: 1,
          lastLogin: 1,
          marks: 1,
          groups: 1,
          emailSentAt: "$latestJob.updatedAt",
        },
      },
    ]);
    if (result.length === 0) {
      throw new Error("Student not found");
    }
    return result[0];
  } catch (err: any) {
    throw new Error(
      `Failed to get student by id with group project: ${err.message}`
    );
  }
};

export const getStudentByLecturer = async (studentId: string) => {
  try {
    const result = await getStudentByIdWithGroupProject(studentId);

    return {
      _id: result._id,
      name: result.name,
      email: result.email,
      matric: result.matric,
      batch: result.batch,
      loginAsBatch: result.loginAsBatch,
      lastLogin: result.lastLogin,
      createdAt: result.createdAt,
      emailSentAt: result.emailSentAt,
      groups: result.groups.map((group: any) => {
        const groupData = {
          _id: group._id,
          name: group.name,
          description: group.description,
          batch: group.batch,
        };

        if (group.project === undefined || group.project._id === undefined) {
          return groupData;
        }

        let totalMark = 0;

        const markObtained =
          (result.marks !== undefined &&
          result.marks?.find((x: any) => x.batch === group.batch) !== undefined
            ? result.marks
                .find((x: any) => x.batch === group.batch)
                .mark_items.reduce((x: number, y: any) => {
                  totalMark += 10;
                  return x + y.mark_value / 5;
                }, 0)
            : 0) +
          (group.project.mark_items !== undefined
            ? group.project.mark_items?.reduce((x: number, y: any) => {
                let accMark = 0;
                switch (y.deliverables_type) {
                  case 1:
                    totalMark += 5;
                    accMark = y.overall_mark / 2;
                    break;
                  case 2:
                    totalMark += 5;
                    accMark = y.overall_mark / 2;
                    break;
                  case 3:
                    totalMark += 15;
                    accMark = y.overall_mark;
                    break;
                  case 4:
                    totalMark += 15;
                    accMark = y.overall_mark;
                    break;
                  case 5:
                    totalMark += 10;
                    accMark = y.overall_mark;
                    break;
                  case 6:
                    totalMark += 5;
                    accMark = y.overall_mark / 2;
                    break;
                  case 7:
                    totalMark += 5;
                    accMark = y.overall_mark / 2;
                    break;
                  case 8:
                    totalMark += 5;
                    accMark = y.overall_mark / 2;
                    break;
                  case 9:
                    totalMark += 5;
                    accMark = y.overall_mark / 2;
                    break;
                  default:
                    break;
                }
                return x + accMark;
              }, 0)
            : 0);

        let markReturn =
          totalMark !== 0 ? `${markObtained.toFixed(2)} / ${totalMark}` : "-";

        return {
          ...groupData,
          project: {
            _id: group.project._id,
            title: group.project.title,
            description: group.project.description,
            mark: markReturn,
          },
        };
      }),
    };
  } catch (error: any) {
    throw new Error(`Failed to get student identity: ${error.message}`);
  }
};

export const handleStudentRegistration = async (
  studentData: studentDataType
) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Begin transaction

  try {
    let studentId = null;
    const { email, matric, batch } = studentData;
    const password = generateRandomPassword();
    const hashedPassword = await hashPassword(password);

    const studentExistWithAccount = await Student.findOne({ email: email })
      .session(session)
      .read("primary");
    const studentExistWithAccountAndBatch = await Student.findOne({
      email: email,
      "batch.batch": batch, // Use dot notation to access the batch property within the batch array
    })
      .session(session)
      .read("primary");
    const categoryExist = await Category.findOne({ name: batch })
      .session(session)
      .read("primary");
    if (studentExistWithAccountAndBatch) {
      throw new Error(
        `Student Account already exists and registered in batch ${batch}`
      );
    } else if (categoryExist === null) {
      throw new Error(`Batch ${batch} does not exist`);
    } else if (studentExistWithAccount) {
      // Update existing student with new batch
      studentExistWithAccount.batch.push({
        batch: batch,
        _id: new mongoose.Types.ObjectId(),
      });
      studentExistWithAccount.password = hashedPassword;
      studentExistWithAccount.matricNumber = matric;
      studentExistWithAccount.loginAsBatch = batch;
      await studentExistWithAccount.save({ session }); // Save within the transaction

      // Update the Category with the new student ID
      studentId = studentExistWithAccount._id;
      const ccResult = await Category.updateOne(
        { name: batch },
        {
          $push: {
            belonged: studentId, // Use studentCreated[0] because create returns an array
          },
        },
        { session } // Pass the session to the update
      );

      if (!ccResult.acknowledged && ccResult.modifiedCount === 0) {
        throw new Error("Batch not updated");
      }
    } else {
      // Create a new student
      const studentCreated = await Student.create(
        [
          {
            name: "Anonymous",
            email: email,
            role: "student",
            matricNumber: matric,
            batch: [{ batch: batch }],
            loginAsBatch: batch,
            point: 0,
            created_at: new Date(),
            password: hashedPassword,
          },
        ],
        { session }
      ); // Create within the transaction

      // Update the Category with the new student ID
      studentId = studentCreated[0]._id;
      const ccResult = await Category.updateOne(
        { name: batch },
        {
          $push: {
            belonged: studentId, // Use studentCreated[0] because create returns an array
          },
        },
        { session } // Pass the session to the update
      );

      if (!ccResult.acknowledged && ccResult.modifiedCount === 0) {
        throw new Error("Batch not updated");
      }
    }

    // Send registration email
    await EmailService.sendEmailToStudentRegistration(
      email,
      matric,
      batch,
      password
    );
    await session.commitTransaction();
  } catch (err: any) {
    await session.abortTransaction(); // Abort on error
    throw new Error(`Failed to register student: ${err.message}`);
  } finally {
    session.endSession(); // End the session
  }
};

export const getClientWithProjectGroup = async (client_id: string) => {
  try {
    const result = await Client.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(client_id),
        },
      },
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
          preserveNullAndEmptyArrays: true, // Keep clients without projects
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "project._id",
          foreignField: "project",
          as: "group",
        },
      },
      {
        $unwind: {
          path: "$group",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$group.team_members",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "group.team_members.group_role": "Leader",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "group.team_members.student_id",
          foreignField: "_id",
          as: "group.leader",
        },
      },
      {
        $unwind: {
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
            title: "$project.title",
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
    if (result.length === 0) {
      throw new Error("Client not found");
    }
    return result[0] || {};
  } catch (err: any) {
    throw new Error(`Failed to get client with project group: ${err.message}`);
  }
};

export const getGroupProject = async () => {
  try {
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
        $project: {
          _id: 1,
          name: 1,
          batch: 1,
          project: {
            _id: "$project._id",
            title: "$project.title",
          },
        },
      },
    ]);

    return result;
  } catch (err: any) {
    throw new Error(`Failed to get group project: ${err.message}`);
  }
};

export const getClientList = async () => {
  try {
    const result = await Client.aggregate([
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project"
        }
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup:
          {
            from: "groups",
            localField: "project._id",
            foreignField: "project",
            as: "group"
          }
      },
      {
        $unwind:
          {
            path: "$group",
            preserveNullAndEmptyArrays: true
          }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          role: 1,
          designation: 1,
          company: 1,
          email: 1,
          created_at: 1,
          batch: 1,
          project: {
            _id: "$project._id",
            title: "$project.title"
          },
          groupName: "$group.name"
        }
      }
    ]);
    return result;
  } catch (err: any) {
    throw new Error(`Failed to get client list: ${err.message}`);
  }
};

export const getClient = async (clientId: string) => {
  try {
    const result = await Client.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(clientId),
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "project",
          foreignField: "project",
          as: "group",
        },
      },
      {
        $unwind: {
          path: "$group",
          preserveNullAndEmptyArrays: true,
        },
      },
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
        $project: {
          _id: 1,
          name: 1,
          batch: 1,
          email: 1,
          role: 1,
          designation: 1,
          company: 1,
          created_at: 1,
          group: {
            _id: "$group._id",
            name: "$group.name",
          },
          project: {
            _id: "$project._id",
            title: "$project.title",
          },
        },
      },
    ]);
    return result[0];
  } catch (err: any) {
    throw new Error(`Failed to get client list: ${err.message}`);
  }
};

export const getStudentWithGroupAndProject = async (studentId: string) => {
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
          as: "groups.project",
        },
      },
      {
        $unwind: {
          path: "$groups.project",
          preserveNullAndEmptyArrays: true,
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
            mark: {
              $first: "$mark",
            },
            groups: {
              $push: {
                _id: "$groups._id",
                name: "$groups.name",
                description: "$groups.description",
                batch: "$groups.batch",
                project: {
                  _id: "$groups.project._id",
                  title: "$groups.project.title",
                  description: "$groups.project.description",
                  mark: "$groups.project.mark_items",
                },
              },
            },
          },
      },
    ]);
    if (result.length === 0) {
      throw new Error("Student not found");
    }
    return result[0];
  } catch (err: any) {
    throw new Error(`Failed to get student identity: ${err.message}`);
  }
};

export const checkVisibleMark = async (batch: string[]) => {
  try {
    const result = await Category.find({ name: { $in: batch } });
    if (!result) {
      throw new Error("Batch not found");
    }
    return result.map((x: any) => ({
      batch: x.name,
      visibleMark: x.visibleMark,
    }));
  } catch (err: any) {
    throw new Error(`Failed to check visible mark: ${err.message}`);
  }
};

export const getStudentIdentity = async (studentId: string) => {
  try {
    const result = await getStudentWithGroupAndProject(studentId);
    const isVisibleMark = await checkVisibleMark(
      result.batch.map((x: any) => x.batch)
    );

    return {
      _id: result._id,
      name: result.name,
      email: result.email,
      matric: result.matric,
      batch: result.batch,
      loginAsBatch: result.loginAsBatch,
      role: "student",
      createdAt: result.createdAt,
      groups: result.groups.map((group: any) => {
        let isVisible = isVisibleMark.find(
          (x: { batch: string; visibleMark: boolean }) =>
            x.batch === group.batch
        )?.visibleMark;

        const groupData = {
          _id: group._id,
          name: group.name,
          description: group.description,
          batch: group.batch,
        };

        if (group.project === undefined || group.project._id === undefined) {
          return groupData;
        }

        let totalMark = 0;

        const markObtained = isVisible
          ? (result.mark !== undefined &&
            result.mark?.find((x: any) => x.batch === group.batch) !== undefined
              ? result.mark
                  .find((x: any) => x.batch === group.batch)
                  .mark_items.reduce((x: number, y: any) => {
                    totalMark += 10;
                    return x + y.mark_value / 5;
                  }, 0)
              : 0) +
            (group.project.mark !== undefined
              ? group.project.mark?.reduce((x: number, y: any) => {
                  let accMark = 0;
                  switch (y.deliverables_type) {
                    case 1:
                      totalMark += 5;
                      accMark = y.overall_mark / 2;
                      break;
                    case 2:
                      totalMark += 5;
                      accMark = y.overall_mark / 2;
                      break;
                    case 3:
                      totalMark += 15;
                      accMark = y.overall_mark;
                      break;
                    case 4:
                      totalMark += 15;
                      accMark = y.overall_mark;
                      break;
                    case 5:
                      totalMark += 10;
                      accMark = y.overall_mark;
                      break;
                    case 6:
                      totalMark += 5;
                      accMark = y.overall_mark / 2;
                      break;
                    case 7:
                      totalMark += 5;
                      accMark = y.overall_mark / 2;
                      break;
                    case 8:
                      totalMark += 5;
                      accMark = y.overall_mark / 2;
                      break;
                    case 9:
                      totalMark += 5;
                      accMark = y.overall_mark / 2;
                      break;
                    default:
                      break;
                  }
                  return x + accMark;
                }, 0)
              : 0)
          : "-";

        let markReturn =
          markObtained !== "-"
            ? `${markObtained.toFixed(2)} / ${totalMark}`
            : markObtained;

        return {
          ...groupData,
          project: {
            _id: group.project._id,
            title: group.project.title,
            description: group.project.description,
            mark: markReturn,
          },
        };
      }),
    };
  } catch (error: any) {
    throw new Error(`Failed to get student identity: ${error.message}`);
  }
};

export const getLecturerIdentity = async (
  lecturerId: mongoose.Types.ObjectId
) => {
  try {
    const result = await Lecturer.findOne({ _id: lecturerId });
    if (!result) {
      throw new Error("Lecturer not found");
    }

    return {
      _id: result._id,
      name: result.name,
      email: result.email,
      role: result.role,
      designation: result.designation,
      company: result.company,
      createdAt: result.created_at,
    };
  } catch (err: any) {
    throw new Error(`Failed to get lecturer identity: ${err.message}`);
  }
};

export const handleEmailResendToStudent = async (studentId: string) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const password = generateRandomPassword();
    const hashedPassword = await hashPassword(password);
    student.password = hashedPassword;
    await student.save();

    await EmailService.sendEmailToStudentRegistration(
      student.email,
      student.matricNumber,
      student.loginAsBatch,
      password
    );
  } catch (err: any) {
    throw new Error(`Failed to resend email to student: ${err.message}`);
  }
};

export const removeStudentFromBatch = async (
  studentId: mongoose.Types.ObjectId,
  batch: string,
  session: ClientSession
) => {
  try {
    // remove Assessment
    await AssessmentService.removeUserFromAssessment(studentId, batch, session);
    // remove Assessment Result
    await AssessmentResultService.removeStudentAssessmentResult(
      studentId,
      batch,
      session
    );
    // remove Todo

    // remove Group
    // if last student in the group, remove Project, deliverable
    // remove from category
  } catch (error: any) {
    throw new Error(`Failed to remove student from batch: ${error.message}`);
  }
};

export const updateBatchNameOnStudent = async (
  oldBatch: string,
  newBatch: string,
  session: ClientSession
) => {
  try {
    await Student.updateMany(
      { "batch.batch": oldBatch },
      { $set: { "batch.$.batch": newBatch } },
      { session }
    );

    await Student.updateMany(
      { loginAsBatch: oldBatch },
      { $set: { loginAsBatch: newBatch } },
      { session }
    );
  } catch (error: any) {
    throw new Error(`Failed to update batch name on student: ${error.message}`);
  }
};

export const updateBatchNameOnClient = async (oldBatch: string, newBatch: string, session: ClientSession) => {
  try {
    await Client.updateMany(
      { batch: oldBatch },
      { batch: newBatch },
      { session }
    );
  } catch (error: any) {
    throw new Error(`Failed to update batch name on client: ${error.message}`);
  }
};
