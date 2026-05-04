import mongoose from "mongoose";
import connectDB from "../database";
import Group from "../models/Group";
import Project from "../models/Project";
import Student from "../models/Student";
import { ChatTask } from "../models/ChatTask";

const DEMO_PROJECT_TITLE = "Chatbox UI Demo Project";

async function createChatDemo() {
  await connectDB();

  try {
    const students = await Student.find({
      email: {
        $in: [
          "student1@example.com",
          "student2@example.com",
          "student3@example.com",
          "student4@example.com",
        ],
      },
    });

    const byEmail = new Map(students.map((student) => [student.email, student]));
    const leader = byEmail.get("student1@example.com");
    const member2 = byEmail.get("student2@example.com");
    const member3 = byEmail.get("student3@example.com");
    const member4 = byEmail.get("student4@example.com");

    if (!leader || !member2 || !member3 || !member4) {
      throw new Error("Missing one or more demo students: student1-4@example.com");
    }

    const existingProject = await Project.findOne({ title: DEMO_PROJECT_TITLE });
    if (existingProject) {
      await ChatTask.deleteMany({ projectId: existingProject._id });
      await Group.deleteMany({ project: existingProject._id });
      await Project.deleteOne({ _id: existingProject._id });
    }

    const project = await Project.create({
      title: DEMO_PROJECT_TITLE,
      description:
        "A dedicated demo project for verifying leader/member chatbox behavior in production.",
      deliverables: [],
      mark_items: [],
      to_do_list: [],
      sprint_list: [],
      badges: [],
    });

    await Group.create({
      name: "Chatbox Demo Group",
      description: "Demo group for chatbox UI verification.",
      batch: "24/25",
      project: project._id,
      team_members: [
        {
          student_id: leader._id,
          group_role: "Leader",
          project_role: ["Project Manager"],
        },
        {
          student_id: member2._id,
          group_role: "Member",
          project_role: ["Frontend Developer"],
        },
        {
          student_id: member3._id,
          group_role: "Member",
          project_role: ["Backend Developer"],
        },
        {
          student_id: member4._id,
          group_role: "Member",
          project_role: ["QA Tester"],
        },
      ],
    });

    const now = Date.now();
    await ChatTask.insertMany([
      {
        projectId: project._id,
        createdBy: leader._id,
        assignedTo: member2._id,
        title: "Design dashboard wireframe",
        description: "Prepare the main dashboard layout and navigation flow.",
        status: "assigned",
        dueAt: new Date(now + 2 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: project._id,
        createdBy: leader._id,
        assignedTo: member3._id,
        title: "Build project API endpoint",
        description: "Create and test the API needed by the project dashboard.",
        status: "in_progress",
        dueAt: new Date(now + 4 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: project._id,
        createdBy: leader._id,
        assignedTo: member4._id,
        title: "Prepare UI test checklist",
        description: "Verify login, project selection, team task display, and task status updates.",
        status: "assigned",
        dueAt: new Date(now + 5 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: project._id,
        createdBy: leader._id,
        assignedTo: member2._id,
        title: "Upload demo evidence",
        description: "Attach sample evidence to confirm completed-task display.",
        status: "done",
        dueAt: new Date(now - 24 * 60 * 60 * 1000),
        evidenceLink: "https://example.com/demo-evidence.pdf",
        completedAt: new Date(),
      },
    ]);

    console.log("Chatbox UI demo created.");
    console.log("Leader: student1@example.com / 123456789");
    console.log(`Project: ${DEMO_PROJECT_TITLE}`);
  } finally {
    await mongoose.connection.close();
  }
}

createChatDemo().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
