import { Worker, Job } from "bullmq";
import { mainQueue } from "./QueueManager";
import {
  handleStudentRegistration,
  handleEmailResendToStudent,
} from "../services/UserManagementService";
import { sendOtpEmail } from "../services/EmailService";
import mongoose, { Types } from "mongoose";
import Student from "../models/Student";
import JobModel from "../models/Job";
import { handleDeleteDeliverable } from "../controllers/deliverablesController";
import { JobData } from "../models/Job";
import { sendEmailToClientEvaluation } from "../services/EmailService";
import { AssessmentResultService } from "../services/AssessmentResultService";
import { AUTO_END_AND_MARK_ASSESSMENT_JOB_REPEAT_INTERVAL_IN_MINUTES } from "../utils/constants";

export enum JobType {
  STUDENT_REGISTRATION = "studentRegistration",
  RESEND_EMAIL_STUDENT = "resendEmailStudent",
  SEND_EMAIL = "sendEmail",
  MARK_ASSESSMENT_RESULT = "markAssessmentResult",
  DELETE_DELIVERABLE = "deleteDeliverable",
  AUTO_END_MARK_ASSESSMENT_RESULT = "autoEndMarkAssessmentResult", // auto end and mark assessment result
  SEND_OTP_EMAIL = "sendOtpEmail",
}

export const initializeMainWorker = () => {
  // trigger when a job is added to the queue
  // WARNING: Job may be processed BEFORE code in waiting has finished execution
  mainQueue.on("waiting", async (job) => {
    // let { jobType, data } = job.data;
    // if (jobType == JobType.STUDENT_REGISTRATION)
    //   JobModel.create({
    //     jobId: job.id,
    //     jobContent: `Add student, ${data.matric} with email = ${data.email} to batch ${data.batch}`,
    //     type: 0,
    //     batch: data.batch,
    //     status: "pending",
    //   });
    try {
      let { jobType, data } = job.data;
      if (jobType === JobType.DELETE_DELIVERABLE)
      await JobModel.create({
        jobId: job.id,
        jobContent: `Delete deliverable with id = ${data.deliverableId} from project with id = ${data.projectId}`,
        type: 5,
        status: "pending",
      });
    } catch (error: any) {
      console.error(`Error adding job to the queue: ${error}`);
    }
  });

  mainQueue.upsertJobScheduler(
    JobType.AUTO_END_MARK_ASSESSMENT_RESULT,
    {
      every: AUTO_END_AND_MARK_ASSESSMENT_JOB_REPEAT_INTERVAL_IN_MINUTES * 60000,
    },
    {
      name: JobType.AUTO_END_MARK_ASSESSMENT_RESULT,
      opts: {},
    },
  );

  // Initialize a worker to process jobs from the main queue
  const worker = new Worker(
    mainQueue.name,
    async (job: Job) => {
      const { jobType, data } = job.data;

      switch (job.name) {
        case JobType.STUDENT_REGISTRATION:
          await handleStudentRegistration(data);
          break;
        case JobType.SEND_OTP_EMAIL:
          // Send email logic here
          await sendOtpEmail(data.email, data.otp);
          break;
        case JobType.RESEND_EMAIL_STUDENT:
          // Send email logic here
          await handleEmailResendToStudent(data.userId);
          break;
        case JobType.SEND_EMAIL:
          // Send email logic here
          if (data.type === 4) {
            const clientEvaluationData =
              data as JobData.ISendClientEvaluationEmail;
            await sendEmailToClientEvaluation(
              clientEvaluationData.clientId.toString(),
              clientEvaluationData.clientAccessCode
            );
          }
          break;
        case JobType.AUTO_END_MARK_ASSESSMENT_RESULT:
          await AssessmentResultService.autoEndAndMarkAssessmentResult();          
          break;
        case JobType.DELETE_DELIVERABLE:
          await handleDeleteDeliverable(data);
          // Delete deliverable logic here
          break;
        default:
          console.warn(`Unknown job type: ${jobType}`);
      }
    },
    {
      connection: mainQueue.opts.connection,
    }
  );

  // trigger when a job is completed
  worker.on("completed", async (jobCompleted: Job) => {
    try {
      switch (jobCompleted.name) {
        case JobType.STUDENT_REGISTRATION:
          let jobGet = await JobModel.findOne({ _id: jobCompleted.data.data.job_id });
          const userId = await Student.findOne({
            email: jobCompleted.data.data.email,
          });

          jobGet!.userId =
            userId?._id instanceof mongoose.Types.ObjectId ? userId._id : null;
          jobGet!.status = "completed";
          await jobGet!.save();
          break;
        case JobType.RESEND_EMAIL_STUDENT:
          let jobAccess = await JobModel.findOne({ _id: jobCompleted.data.data.job_id });
          jobAccess!.status = "completed";
          await jobAccess!.save();
          break;
        case JobType.SEND_EMAIL:
          if (jobCompleted.data?.data?.type === 4) {
            const jobGet2 = await JobModel.findById(jobCompleted.id);
            jobGet2!.status = "completed";
            await jobGet2!.save();
          }
          break;
        default:
          break;
      }
    } catch (error: any) {
      console.error(`Error updating job status: ${error}`);
    }
  });

  // trigger when a job fails
  worker.on("failed", async (job, err) => {
    try {
      if (job === null) return;
      else {
        console.log('job failed', job);
        console.error(err);
        if (job!.name === JobType.AUTO_END_MARK_ASSESSMENT_RESULT) {
          return;
        }
        let jobGet;
        if (job?.data?.data?.type !== undefined && job?.data?.data?.type === 4) {
          jobGet = await JobModel.findById(job?.id);
        } else {
          jobGet = await JobModel.findOne({ _id: job?.data.data.job_id });
        }
        jobGet!.status = "failed";
        jobGet!.error = `${err}`;
        await jobGet!.save();
      }
    } catch (error: any) {
      console.error(`Error updating job status: ${error}`);
    }
  });
};
