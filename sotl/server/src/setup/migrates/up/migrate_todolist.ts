import ToDoList from "../../../models/ToDoList"; // Import the ToDoList model
import Group from "../../../models/Group";
import Project from "../../../models/Project";
import { ClientSession } from "mongoose"; // Import ClientSession from mongoose
import TaskContent from "../../../models/TaskContent";
import Sprint from "../../../models/Sprint";
import moment from "moment";

// Define the migration function for ToDoLists
export async function migrateToDoLists(session: ClientSession): Promise<void> {
  try {
    // From project
    const groups = await Group.find({batch: '24/25'}).session(session).read("primary");

    // Define the dummy data
    const taskTitle = [
      "Research on project topic",
      "Write introduction section",
      "Prepare methodology section",
      "Collect data for analysis",
      "Prepare presentation slides",
      "Finalize project report",
      "Submit project report",
    ];
    const toDoTitle = [
      "Complete Project Proposal",
      "Complete Project Proposal Ammendment",
      "Complete SDS",
      "Complete SRS",
    ];

    // Iterate over each group
    for (const group of groups) {
      // Get the project associated with the group
      const project = await Project.findOne({ _id: group.project }).session(session).read("primary");

      if (project) {
        // Create a ToDoList for the project
        let toDoLists = [];
        for (const title of toDoTitle) {
          // Create a task for each team member
          let taskList = [];
          for (const [index, member] of group.team_members.entries()) {
            taskList.push({
              creator: member.student_id, // Reference to Student ObjectId
              assignee: member.student_id, // Reference to Student ObjectId
              title: taskTitle[index],
              description: `${taskTitle[index]} description`,
              status: 0,
              priority: 0,
              created_at: moment().startOf("day"),
              updated_at: moment().startOf("day"),
              completed_at: moment().startOf("day").add(7, 'd'), // Due in 7 days
              comments: []
            });
          };

          // Insert the Task data into the database
          const taskListDatas = await TaskContent.insertMany(taskList, { session });
          const taskIds = taskListDatas.map(task => task._id);

          const toDoContent = {
            creator: group.team_members[0].student_id,
            assignee: group.team_members[0].student_id,
            title: title,
            description: `${title} description`,
            status: 0,
            priority: 0,
            created_at: moment().startOf("day"),
            updated_at: moment().startOf("day"),
            completed_at: moment().startOf("day").add(7, 'd'), // Due in 7 days
            comments: []
          }

          toDoLists.push({
            tasks: taskIds,
            task_content: await TaskContent.create(toDoContent).then(task => task._id),
          });
        }

        // Insert the ToDoList data into the database
        const toDoListDatas = await ToDoList.insertMany(toDoLists, { session });

        // Create a Sprint for the project
        const sprintContent = {
          creator: group.team_members[0].student_id,
          assignee: group.team_members[0].student_id,
          title: "Sprint 1",
          description: "Sprint 1 description",
          status: 0,
          created_at: moment().startOf("day"),
          updated_at: moment().startOf("day"),
          completed_at: moment().startOf("day").add(7, 'd'), // Due in 7 days
          comments: []
        };
        const sprint = {
          to_do_list: [toDoListDatas[0]._id],
          task_content: await TaskContent.create(sprintContent).then(task => task._id)
        };
        const sprintId = await Sprint.create(sprint).then(sprint => sprint._id);

        project!.to_do_list = toDoListDatas.slice(1).map(toDo => toDo._id as any);
        project!.sprint_list = [sprintId as any];

        await project.save({ session });
      }
    }

    console.log("ToDoLists migration : Done!");
  } catch (e) {
    // Customize error message
    let customErrorMessage = `
      Error during ToDoLists migration:
      - Reason: Failed to insert ToDoList data into the database.
    `;

    if (e instanceof Error) {
      customErrorMessage += `
        - Original Error: ${e.message}
        - Stack Trace: ${e.stack}
      `;
    } else {
      customErrorMessage += `
        - Original Error: ${String(e)}
      `;
    }

    throw new Error(customErrorMessage); // Rethrow with customized message
  }
}
