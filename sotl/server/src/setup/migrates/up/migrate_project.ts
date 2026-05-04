import mongoose, { ClientSession } from "mongoose";
import Project from "../../../models/Project"; // Adjust the import path as needed
import Group from "../../../models/Group"; // Adjust the import path as needed
import Deliverables from "../../../models/Deliverables"; // Adjust the import path as needed
import { faker } from "@faker-js/faker";
import { cloneDeep } from "lodash";

interface DeliverableProps {
  name: string;
  file_path_uri: string;
  created_at: Date;
  status?: number;
  comment?: string;
}

// Define the migration function for Projects
export async function migrateProjects(session: ClientSession): Promise<void> {
  try {
    // Fetch all groups and deliverables from the database
    const groups24_25 = await Group.find(
      { batch: '24/25'  },
      "_id batch",
      { session }
    ).read("primary");

    const deliverables = await Deliverables.find(
      {},
      { _id: 1, name: 1, batch: 1 },
      { session }
    ).read("primary");

    const type_map_deliverable = new Map<number, string>([
      [1, "Proposal"],
      [2, "Proposal Revised"],
      [3, "SRS"],
      [4, "SRS Revised"],
      [5, "SDS"],
      [6, "User Manual"],
      [7, "Github Link"],
    ]);

    const projects = [];
    const project_deliverables = [];
    for (let i = 0; i < groups24_25.length; i++) {
      // add projects
      let t_mark_items = [];
      let t_deliverables = [];
      for (let j = 1; j < 10; j++) {
        // Add mark items
        t_mark_items.push({
          deliverables_type: j, // Refers to the type of deliverable (e.g., design)
          overall_mark: faker.number.int({
            min: 0,
            max: j == 3 || j == 4 ? 15 : 10,
          }), // Example mark
        });

        // Add deliverables
        if (j < 8) {
          let t: DeliverableProps = {
            name: type_map_deliverable.get(j) || "Unknown Deliverable",
            file_path_uri: faker.system.filePath(),
            created_at: faker.date.past(),
          };
          if (j < 5) {
            t.status = faker.number.int({ min: 0, max: 2 });
            if (t.status == 2) {
              t.comment = faker.lorem.sentence({ min: 5, max: 10 });
              let tt: DeliverableProps = {
                name: type_map_deliverable.get(j) || "Unknown Deliverable",
                file_path_uri: faker.system.filePath(),
                created_at: faker.date.past(),
                status: faker.number.int({ min: 0, max: 2 })
              };
              t_deliverables.push(t);
              t_deliverables.push(tt);
              continue;
            }
          }
          t_deliverables.push(t);
        }
      }
      // Add project
      projects.push({
        title: faker.lorem.sentence({ min: 3, max: 15 }),
        description: faker.lorem.sentence({ min: 50, max: 100 }),
        mark_items: t_mark_items,
      });
      // add deliverables
      project_deliverables.push(t_deliverables);
    }

    // Step 1: Insert the projects into the database
    const insertedProjects = await Project.insertMany(projects, { session });
    console.log("Projects migration: Done!");

    // Step 2: Assign project IDs to corresponding groups
    for (let i = 0; i < groups24_25.length; i++) {
      await Group.updateOne(
        { _id: groups24_25[i]._id },
        { $set: { project: insertedProjects[i]._id } },
        { session }
      );
    }
    console.log("Assigned project IDs to groups: Done!");

    // Step 3: Update projects with their corresponding deliverable IDs
    const groupProject = await Group.find(
      { batch: '24/25' },
      { project: 1, batch: 1 },
      { session }
    ).read("primary");

    for (let i = 0; i < groupProject.length; i++) {
      let t_deliverable = project_deliverables[i];
      for (let j = 0; j < t_deliverable.length; j++) {
        let t_deliverable_name = t_deliverable[j].name;
        let t_deliverable_batch = groupProject[i].batch;

        let t_deliverable_item = deliverables.find(
          (deliverable) =>
            deliverable.name === t_deliverable_name &&
            deliverable.batch === t_deliverable_batch
        );

        if (t_deliverable_item) {
          await Project.updateOne(
            { _id: groupProject[i].project },
            {
              $push: {
                deliverables: {
                  ...t_deliverable[j],
                  deliverable_id: t_deliverable_item._id,
                },
              },
            },
            { session }
          );
        }
      }
    }

    console.log(
      "Updated project deliverables with deliverable IDs (batch 24/25): Done!"
    );

    const groups25_26 = await Group.find(
      { batch: { $elemMatch: { batch: "25/26" } } },
      "_id batch",
      { session }
    ).read("primary");

    const projects25_26 = [];
    for (let i = 0; i < groups25_26.length; i++) {
      projects25_26.push({
        title: faker.lorem.sentence({ min: 3, max: 15 }),
        description: faker.lorem.sentence({ min: 50, max: 100 }),
        mark_items: [],
      });
    }
    await Project.insertMany(projects25_26, { session });
    console.log(
      "Projects migration (batch 25/26) without mark and deliverable: Done!"
    );
  } catch (error) {
    // Enhanced error handling and logging
    let customErrorMessage = `
      Error during Projects migration:
      - Reason: Failed to insert or update Project data.
    `;

    if (error instanceof Error) {
      customErrorMessage += `
        - Original Error: ${error.message}
        - Stack Trace: ${error.stack}
      `;
    } else {
      customErrorMessage += `
        - Original Error: ${String(error)}
      `;
    }

    throw new Error(customErrorMessage);
  }
}
