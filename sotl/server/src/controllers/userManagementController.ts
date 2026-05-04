import { Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../utils/response";
import { AuthRequest } from "../middlewares/authMiddleware";
import * as UserManagementService from "../services/UserManagementService";
import * as EmailService from "../services/EmailService";
import Category from "../models/Category";
import Student from "../models/Student";
import Client from "../models/Client";
import JobModel from "../models/Job";
import { hashPassword } from "../utils/methods/password_hashing";
import { mainQueue } from "../queue/QueueManager";
import { generateRandomPassword, checkBatches } from "../utils/methods";
import _ from "lodash";
import { ErrorWithCode } from "../utils/error";
import { AssessmentResultService } from "../services/AssessmentResultService";
import * as NotificationService from "../services/NotificationService";
import { GroupService } from "../services/GroupService";
import { TodoService } from "../services/TodoService";
import { AssessmentService } from "../services/AssessmentService";
import { CategoryService } from "../services/CategoryService";
import { DeliverableService } from "../services/DeliverableService";
import * as GamificationService from "../services/GamificationService";
import { JobService } from "../services/JobService";
import User from "@/models/User";

const getAllBatchStudent = async (req: AuthRequest, res: Response) => {
  try {
    // Your logic here
    const batchStudent = await UserManagementService.getAllBatchStudents();
    res.json(
      successResponse(batchStudent, "Batch students fetched successfully")
    );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await UserManagementService.getStudentByLecturer(id);
    if (!student) {
      throw new Error("Student not found");
    }
    res.json(successResponse(student, "Student fetched successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getBatchCategory = async (req: AuthRequest, res: Response) => {
  try {
    const response = await Category.find({ type: 0 }).read("primary");
    if (!response) {
      throw new Error("Batch category not found");
    }
    res.json(
      successResponse(
        response.map((item) => {
          return {
            _id: item._id,
            batch: item.name,
          };
        }),
        "Batch category fetched successfully"
      )
    );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const removeCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).read("primary");
    if (!category) {
      throw new Error("Category not found");
    }
    // Check if the category has students, prevent deletion if it has students, type 0 is batch category
    if (category.type == 0 && category.belonged.length > 0) {
      throw new Error("Category has student, please remove student first");
    }
    await category.deleteOne();
    res.json(successResponse(true, "Category removed successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const editCategoryName = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Begin transaction
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id)
      .session(session)
      .read("primary");
    if (!category) {
      throw new Error("Category not found");
    }
    let originalName = category.name;
    category.name = name;
    await category.save({ session });

    // Update Group (Team) batch name
    await GroupService.updateBatchNameOnGroup(originalName, name, session);
    // Update User (Student) loginAsBatch + batch
    await UserManagementService.updateBatchNameOnStudent(
      originalName,
      name,
      session
    );
    // Update Client
    await UserManagementService.updateBatchNameOnClient(
      originalName,
      name,
      session
    );

    // Update Deliverable
    await DeliverableService.updateBatchNameOnDeliverable(
      originalName,
      name,
      session
    );

    // Update Badge
    await GamificationService.updateBatchNameOnBadges(
      originalName,
      name,
      session
    );

    // Update Job
    await JobService.updateBatchNameOnJob(originalName, name, session);

    await session.commitTransaction();

    res.json(successResponse(true, "Category name updated successfully"));
  } catch (error: any) {
    await session.abortTransaction(); // Abort the transaction on error
    res.status(500).json(errorResponse(error.message));
  } finally {
    session.endSession(); // End the session
  }
};

const addBatchCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      throw new Error("Name is required");
    }

    const categoryExist = await Category.findOne({ name: name, type: 0 }).read(
      "primary"
    );
    const categoryExistWithCustom = await Category.findOne({
      name: name,
      type: 1,
    }).read("primary");
    if (categoryExist) {
      throw new Error("Category already exist");
    } else if (categoryExistWithCustom) {
      throw new Error(
        "Category already exist as custom category, please use another name"
      );
    }
    const category = new Category({
      name: name,
      type: 0,
      visibleMark: false,
    });
    const categoryCreated = await category.save();
    res.json(
      successResponse(
        {
          _id: categoryCreated._id,
          batch: categoryCreated.name,
          belonged: categoryCreated.belonged,
          visibleMark: categoryCreated.visibleMark,
          createdAt: categoryCreated.createdAt,
        },
        "Category added successfully"
      )
    );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const addCustomCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      throw new Error("Name is required");
    }

    const categoryExist = await Category.findOne({ name: name, type: 1 }).read(
      "primary"
    );

    const categoryExistWithBatch = await Category.findOne({
      name: name,
      type: 0,
    }).read("primary");
    if (categoryExist != null) {
      throw new Error("Category already exist, please use another name");
    } else if (categoryExistWithBatch != null) {
      throw new Error(
        "Category already exist as batch, please use another name"
      );
    }
    const category = new Category({
      name: name,
      type: 1,
      visibleMark: false,
    });
    await category.save();
    res.json(successResponse(true, "Category added successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const editCategoryVisibleMark = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { visibleMark } = req.body;
    const category = await Category.findById(id).read("primary");
    if (!category) {
      throw new Error("Category not found");
    }
    category.visibleMark = visibleMark;
    await category.save();
    res.json(successResponse(true, "Category visibility updated successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const sendEmailClientEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Client id is required");
    }
    const accessCode = await AssessmentResultService.getClientAccessCode(id);
    await EmailService.sendEmailToClientEvaluation(id, accessCode);
    res.json(successResponse(true, "Email sent successfully"));
  } catch (error: any) {
    if (error instanceof ErrorWithCode) {
      res.status(error.responseCode).json(error.response);
      return;
    }
    res.status(500).json(errorResponse(error.message));
  }
};

const addStudentToJob = async (req: AuthRequest, res: Response) => {
  try {
    const { batch, email, matricNumber } = req.body;
    const studentAdd = {
      batch: batch,
      email: email,
      matric: matricNumber,
    };

    await mainQueue.add("studentRegistration", {
      jobType: "studentRegistration",
      data: studentAdd,
    });

    res.status(200).send(successResponse(true, "Student added successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const addStudentsBulk = async (req: AuthRequest, res: Response) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      throw new Error("Students must be an array and not empty");
    }

    students.forEach(
      async ({
        batch,
        email,
        matric,
      }: {
        batch: string;
        email: string;
        matric: string;
      }) => {
        const jobCreated = await JobModel.create({
          jobContent: `Add student, ${matric} with email = ${email} to batch ${batch}`,
          type: 0,
          batch: batch,
          status: "pending",
        });

        await mainQueue.add("studentRegistration", {
          jobType: "studentRegistration",
          data: {
            batch,
            email,
            matric,
            job_id: jobCreated._id,
          },
        });
      }
    );

    res.status(200).send(successResponse(true, "Student added successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const addStudentManually = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Begin transaction
  try {
    let studentId = null;
    const { batch, email, matric, password } = req.body;
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
        `Student Account already exist and registered on batch ${batch}`
      );
    } else if (categoryExist === null) {
      throw new Error(`Batch ${batch} does not exist`);
    } else if (studentExistWithAccount) {
      studentExistWithAccount.batch.push({
        batch: batch,
        _id: new mongoose.Types.ObjectId(),
      });
      studentExistWithAccount.password = hashedPassword;
      studentExistWithAccount.matricNumber = matric;
      studentExistWithAccount.loginAsBatch = batch;
      await studentExistWithAccount.save({ session });
      studentId = studentExistWithAccount._id;
      const cResult = await Category.updateOne(
        { name: batch },
        {
          $push: {
            belonged: studentId, // Use studentCreated[0] because create returns an array
          },
        },
        { session } // Pass the session to the update
      );

      if (!cResult.acknowledged && cResult.modifiedCount === 0) {
        throw new Error("Batch not updated");
      }
    } else {
      const studentCreated = await Student.create(
        [
          {
            name: "Anonymous",
            email: email,
            role: "student",
            matricNumber: matric,
            batch: [{ batch: batch }],
            point: 0,
            loginAsBatch: batch,
            created_at: new Date(),
            password: hashedPassword,
          },
        ],
        { session }
      );
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
    await session.commitTransaction();
    if (studentId === null || studentId === undefined) {
      throw new Error("Student not assigned");
    }
    const studentNewCreated =
      await UserManagementService.getStudentByIdWithGroupProject(
        studentId.toString()
      );

    res.json(successResponse(studentNewCreated, "Student added successfully"));
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json(errorResponse(error.message));
  } finally {
    session.endSession();
  }
};

const editStudent = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start the transaction

  try {
    const { id } = req.params;
    const { name, batches, email, matric, password } = req.body;
    let hasChange = false;
    // Fetch the student within the transaction
    const studentExistWithAccount = await Student.findById(id)
      .session(session)
      .read("primary");
    if (!studentExistWithAccount) {
      throw new Error("Student not found");
    }

    if (email !== undefined) {
      const emailExist = await Student.findOne({ email: email })
        .session(session)
        .read("primary");
      if (emailExist) {
        if (String(emailExist._id).toString() !== id) {
          throw new Error(`Email already exists`);
        }
      }
      studentExistWithAccount.email = email;
      hasChange = true;
    }

    if (password !== undefined) {
      const hashedPassword = await hashPassword(password);
      studentExistWithAccount.password = hashedPassword;
      hasChange = true;
    }

    if (name !== undefined) {
      studentExistWithAccount.name = name;
      hasChange = true;
    }

    if (matric !== undefined) {
      studentExistWithAccount.matricNumber = matric;
      hasChange = true;
    }

    // Compare and update batches
    if (batches !== undefined) {
      if (!Array.isArray(batches)) {
        throw new Error("Batches must be an array");
      }
      const { isAdd, isRemove, addBatchArray, removeBatchArray } = checkBatches(
        studentExistWithAccount.batch,
        batches
      );

      // Remove batches if necessary
      if (isRemove) {
        // check batch is valid
        studentExistWithAccount.batch = studentExistWithAccount.batch.filter(
          (batch) => !removeBatchArray.includes(batch.batch)
        );
        await Category.updateMany(
          { name: { $in: removeBatchArray } },
          { $pull: { belonged: id } },
          { session } // Pass the session to maintain the transaction
        );
        hasChange = true;
      }

      // Add batches if necessary
      if (isAdd) {
        for (const batch of addBatchArray) {
          const categoryExist = await Category.findOne({ name: batch })
            .session(session)
            .read("primary");
          if (categoryExist === null) {
            throw new Error(`Batch ${batch} does not exist`);
          }

          studentExistWithAccount.batch.push({
            batch: batch,
            _id: new mongoose.Types.ObjectId(),
          });

          await Category.updateOne(
            { name: { $in: batch } },
            { $addToSet: { belonged: id } },
            { session } // Pass the session to maintain the transaction
          );
        }

        hasChange = true;
      }
    }
    if (hasChange) {
      // Save the updated student information within the transaction
      await studentExistWithAccount.save({ session });
    }

    // Commit the transaction
    await session.commitTransaction();
    res.json(successResponse(true, "Student updated successfully"));
  } catch (error: any) {
    await session.abortTransaction(); // Abort the transaction on error
    res.status(500).json(errorResponse(error.message));
  } finally {
    session.endSession();
  }
};

type TodoObjectIds = {
  sprintIds: mongoose.Types.ObjectId[];
  sprintToDoIds: mongoose.Types.ObjectId[];
  todoIds: mongoose.Types.ObjectId[];
  todoTasksIds: mongoose.Types.ObjectId[];
  taskContentIds: mongoose.Types.ObjectId[];
  commentIds: mongoose.Types.ObjectId[];
};

const removeStudent = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession(); // Start a session
  session.startTransaction(); // Begin transaction

  try {
    const { id } = req.params;
    const { batch, confirmDelete } = req.body;
    let warningMessage: string[] = [];

    if (!id || !isValidObjectId(id)) {
      throw new Error("Invalid student id");
    }

    // Find the student within the transaction
    const student = await Student.findOne({
      _id: id,
      batch: { $elemMatch: { batch: batch } },
    })
      .session(session)
      .read("primary");
    if (!student) {
      throw new Error("Student not found");
    }

    // get Group
    const group = await GroupService.getGroup(
      new mongoose.Types.ObjectId(id),
      batch
    );

    if (!confirmDelete) {
      // Check Notification
      if (
        await NotificationService.isHaveNotification(
          new mongoose.Types.ObjectId(id)
        )
      ) {
        warningMessage.push("notification");
      }

      // if student is the last member of the group, notify the user, delete the group and project
      if (group) {
        warningMessage.push("group");
      }

      // Check the comment that have assigned to this student
      TodoService.isHaveComment(group, warningMessage);

      // Check todo that have assigned to this student
      TodoService.isHaveTodo(group, warningMessage);

      // Check Assessment
      if (
        await AssessmentService.isHaveAssessment(
          new mongoose.Types.ObjectId(id)
        )
      ) {
        warningMessage.push("assessment");
      }

      // Check Assessment Result
      if (
        await AssessmentResultService.isHaveAssessmentResult(
          new mongoose.Types.ObjectId(id)
        )
      ) {
        warningMessage.push("assessment result");
      }
    } else {
      const todoObjectIds: TodoObjectIds = {
        sprintIds: [],
        sprintToDoIds: [],
        todoIds: [],
        todoTasksIds: [],
        taskContentIds: [],
        commentIds: [],
      };
      if (group === null || group === undefined) {
        TodoService.extractCommentIds(group, todoObjectIds.commentIds);
        console.log(
          "check todoObjectIds.commentIds:",
          todoObjectIds.commentIds
        );

        await TodoService.extractToDoObjectIdByStudent(
          new mongoose.Types.ObjectId(id),
          group,
          todoObjectIds,
          session
        );

        // remove todo
        await TodoService.removeTodoStudent(
          new mongoose.Types.ObjectId(id),
          batch,
          todoObjectIds,
          session
        );
      }

      // remove assessment
      await AssessmentService.removeUserFromAssessment(
        new mongoose.Types.ObjectId(id),
        batch,
        session
      );

      // remove assessment result
      await AssessmentResultService.removeStudentAssessmentResult(
        new mongoose.Types.ObjectId(id),
        batch,
        session
      );

      // remove group
      const groupRemove = await GroupService.removeStudentFromGroup(
        new mongoose.Types.ObjectId(id),
        batch,
        session
      );
      console.log("groupRemove:", groupRemove);

      if (student.batch.length === 1) {
        await NotificationService.removeNotificationByUserId(
          new mongoose.Types.ObjectId(id),
          session
        );
        await student.deleteOne({ session });
      } else {
        student.batch = student.batch.filter((item) => item.batch !== batch);

        student.loginAsBatch = student.batch[0].batch;
        await student.save({ session });
      }
      await CategoryService.removeStudentFromCategory(
        new mongoose.Types.ObjectId(id),
        batch,
        session
      );
    }

    // Commit the transaction
    await session.commitTransaction();
    if (!confirmDelete) {
      res
        .status(200)
        .json(
          successResponse(
            `Are you sure want to delete this student? Have data with ${warningMessage.join(
              ","
            )}!!!`,
            "Warning"
          )
        );
    } else {
      res
        .status(200)
        .json(successResponse(true, "Student removed successfully"));
    }
  } catch (error: any) {
    await session.abortTransaction(); // Abort transaction on error
    res.status(500).json(errorResponse(error.message));
  } finally {
    session.endSession(); // End the session
  }
};

const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const client = await UserManagementService.getClient(id);
    if (!client) {
      throw new Error("Client not found");
    }
    res.json(successResponse(client, "Client fetched successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const addClient = async (req: AuthRequest, res: Response) => {
  try {
    const { name, designation, company, email, batch, projectId } = req.body;
    const clientExistWithAccount = await Client.findOne({ email: email });
    const clientExistWithProject = await Client.findOne({ project: projectId });
    if (clientExistWithAccount) {
      throw new Error("Client Account already exist");
    }
    if (clientExistWithProject) {
      throw new Error("Client already exist in this project");
    }

    await Client.create({
      name: name,
      designation: designation,
      company: company,
      email: email,
      password: await hashPassword(generateRandomPassword()),
      batch: batch,
      project: projectId,
      role: "client",
    });

    res.json(successResponse(true, "Client added successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const removeClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Check if the ID is valid
    if (!id || !isValidObjectId(id)) {
      throw new Error("Invalid client id");
    }

    // 2. Find the client by ID
    const client = await Client.findById(id).read("primary");
    if (!client) {
      throw new Error("Client not found");
    }

    // 3. Delete the client
    await client.deleteOne();
    res.json(successResponse(true, "Client removed successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const editClient = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession(); // Start the session
  session.startTransaction(); // Start the transaction

  try {
    const { id } = req.params;
    const { name, designation, email, company, projectId } = req.body;

    // 1. Check if the ID is valid
    if (!id || !mongoose.isValidObjectId(id)) {
      throw new Error("Invalid client id");
    }

    // 2. Find the client by ID within the transaction
    const client = await Client.findById(id).session(session).read("primary");
    if (!client) {
      throw new Error("Client not found");
    }

    // 3. Update the client information
    if (name != undefined) client.name = name;
    if (designation != undefined) client.designation = designation;
    if (email != undefined) {
      const emailExist = await Client.findOne({ email: email })
        .session(session)
        .read("primary");
      if (emailExist) {
        if (String(emailExist._id) !== id) {
          throw new Error(`Email already exists`);
        }
      }
      client.email = email;
    }
    if (company != undefined) client.company = company;
    if (projectId != undefined) client.project = projectId;

    // 4. Save the updated client within the transaction
    if (
      name != undefined ||
      designation != undefined ||
      email != undefined ||
      company != undefined ||
      projectId != undefined
    )
      await client.save({ session });

    // 5. Commit the transaction if everything is successful
    await session.commitTransaction();
    res.json(successResponse(true, "Client updated successfully"));
  } catch (error: any) {
    // 6. If an error occurs, abort the transaction
    await session.abortTransaction();
    res.status(500).json(errorResponse(error.message));
  } finally {
    session.endSession();
  }
};

const getStudentsBulkLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ _id: id, type: 0 }).read(
      "primary"
    );

    if (!category) {
      throw new Error("Category not found");
    }

    const jobs = await JobModel.find({ batch: category.name }).sort({
      createdAt: -1,
    });

    res.json(successResponse(jobs, "Student log fetched successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const removeStudentBulkLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const job = await JobModel.findById(id).read("primary");

    if (!job) {
      throw new Error("Job not found");
    }

    await job.deleteOne();
    res.json(successResponse(true, "Student log removed successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getClientList = async (req: AuthRequest, res: Response) => {
  try {
    const clients = await UserManagementService.getClientList();
    res.json(successResponse(clients, "Clients fetched successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getGroupProjectList = async (req: AuthRequest, res: Response) => {
  try {
    const groupProjects = await UserManagementService.getGroupProject();
    res.json(
      successResponse(groupProjects, "Group projects fetched successfully")
    );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const resendStudentEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const jobCreated = await JobModel.create({
      jobContent: `Resend email to student, ${student.email}`,
      type: 1,
      batch:
        student.batch.length > 0
          ? student.batch[student.batch.length - 1].batch
          : "",
      userId: studentId,
      status: "pending",
    });

    await mainQueue.add("resendEmailStudent", {
      jobType: "resendEmailStudent",
      data: {
        email: student.email,
        batch:
          student.batch.length > 0
            ? student.batch[student.batch.length - 1].batch
            : "",
        userId: studentId,
        job_id: jobCreated._id,
      },
    });

    res.json(successResponse(true, "Email sent successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getSelfAssessmentResult = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { batch } = req.body;

    const batchId = await CategoryService.getBatchIdByName(batch);

    const assessmentResult =
      await AssessmentResultService.getSelfAssessmentResultByStudentId(
        new mongoose.Types.ObjectId(studentId),
        new mongoose.Types.ObjectId(batchId)
      );

    const result = [];
    for (const item of assessmentResult) {
      const [pointReturn, scoreReturn] =
        AssessmentResultService.extractPointAndScoreFromAssessmentResult(item);
      const correctReturn = await
        AssessmentResultService.getCorrectAnswerFromAssessmentResult(item);

      result.push({
        _id: item._id,
        assessmentId: item.assessmentId,
        assessmentName: item.assessmentName,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        point: pointReturn,
        score: scoreReturn,
        correct: correctReturn,
      });
    }

    res.json(
      successResponse(result, "Self assessment result fetched successfully")
    );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

type PeerAssessmentResult = {
  asr_id: mongoose.Types.ObjectId;
  as_id: mongoose.Types.ObjectId;
  endedAt: Date;
  evaluator: {
    _id: mongoose.Types.ObjectId;
    name: string;
    accessCode?: string;
  };
  score: number;
  totalScore: number;
};

const getPeerAssessmentResult = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { batch } = req.body;

    const batchId = await CategoryService.getBatchIdByName(batch);

    const assessmentResult =
      await AssessmentResultService.getPeerAssessmentResultInStudentProfileByStudentId(
        new mongoose.Types.ObjectId(studentId),
        new mongoose.Types.ObjectId(batchId),
        1,
        1
      );
    const results: PeerAssessmentResult[] = [];

    for (const item of assessmentResult) {
      const idsArray: mongoose.Types.ObjectId[] = [];
      AssessmentResultService.extractIdsArray(item, idsArray);
      const [scoreObtained, totalScore] =
        await AssessmentResultService.getTotalScoreFromAssessmentResult(
          idsArray
        );

      results.push({
        asr_id: item._id,
        as_id: item.assessment._id,
        endedAt: item.endedAt,
        evaluator: {
          _id: item.evaluator._id,
          name: item.evaluator.name,
        },
        score: scoreObtained,
        totalScore: totalScore,
      });
    }

    res
      .status(200)
      .json(
        successResponse(results, "Peer assessment result fetched successfully")
      );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const getClientEvaluationResult = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { batch } = req.body;

    const batchId = await CategoryService.getBatchIdByName(batch);
    const assessmentResult =
      await AssessmentResultService.getPeerAssessmentResultInStudentProfileByStudentId(
        new mongoose.Types.ObjectId(groupId),
        new mongoose.Types.ObjectId(batchId),
        2,
        2
      );
    const results: PeerAssessmentResult[] = [];

    for (const item of assessmentResult) {
      const idsArray: mongoose.Types.ObjectId[] = [];
      AssessmentResultService.extractIdsArray(item, idsArray);
      const [scoreObtained, totalScore] =
        await AssessmentResultService.getTotalScoreFromAssessmentResult(
          idsArray
        );

      results.push({
        asr_id: item._id,
        as_id: item.assessment._id,
        endedAt: item.endedAt,
        evaluator: {
          _id: item.evaluator._id,
          name: item.evaluator.name,
          accessCode: item.evaluator.access_code,
        },
        score: scoreObtained,
        totalScore: totalScore,
      });
    }

    res
      .status(200)
      .json(
        successResponse(results, "Client evaluation result fetched successfully")
      );
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

const removeAssessmentResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AssessmentResultService.removeAssessmentResult(
      new mongoose.Types.ObjectId(id)
    );
    res.json(successResponse(result, "Assessment result removed successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

export default {
  getAllBatchStudent,
  removeCategory,
  editCategoryName,
  addBatchCategory,
  addCustomCategory,
  editCategoryVisibleMark,
  sendEmailClientEvaluation,
  addStudentToJob,
  addStudentsBulk,
  addStudentManually,
  editStudent,
  removeStudent,
  getClient,
  addClient,
  removeClient,
  editClient,
  getStudentsBulkLog,
  removeStudentBulkLog,
  getClientList,
  getGroupProjectList,
  getStudent,
  getBatchCategory,
  resendStudentEmail,
  getSelfAssessmentResult,
  getPeerAssessmentResult,
  getClientEvaluationResult,
  removeAssessmentResult,
};
