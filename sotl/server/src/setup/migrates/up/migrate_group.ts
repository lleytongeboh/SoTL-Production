import Group from "../../../models/Group";
import Student from "../../../models/Student";
import { ClientSession, Types } from "mongoose";

interface TeamMember {
  student_id: Types.ObjectId; // Assuming Student["_id"] matches the type expected
  group_role: string;
  project_role: string[];
}

// Define the structure of the group
interface GroupData {
  name: string;
  description: string;
  team_members: TeamMember[];
  batch: string;
}

function getCyclicRoles(arr: string[], index: number): string[] {
  const firstRole = arr[index % arr.length]; // Get the first role
  const secondRole = arr[(index + 1) % arr.length]; // Get the next role, wrapping around
  return [firstRole, secondRole];
}

export async function migrateGroups(session: ClientSession): Promise<void> {
  try {
    // Extract all student out of the database, declare all the group names, group roles and project roles
    const studentsBatch24_25 = await Student.find(
      { batch: { $elemMatch: { batch: "24/25" } } },
      "_id batch",
      { session }
    ).read("primary");

    const studentsBatch25_26 = await Student.find(
      { batch: { $elemMatch: { batch: "25/26" } } },
      "_id batch",
      { session }
    ).read("primary");

    const groupRoles: string[] = ["Leader", "Member"];
    const projectRoles: string[] = [
      "Implementation Manager",
      "Planning Manager",
      "Quality Manager",
      "Customer Interface Manager",
      "Support Manager",
      "Process Manager",
      "Test Manager",
    ];

    const groups: GroupData[] = [];
    let i = 0;
    // Create groups for batch 24/25
    while (i < studentsBatch24_25.length) {
      let lastMember = 0;
      if (i + 7 < studentsBatch24_25.length) {
        lastMember = i + 7;
      } else if (i + 7 > studentsBatch24_25.length) {
        lastMember = studentsBatch24_25.length;
      }
      let groupData: GroupData = {
        name: `Group ${i / 7 + 1}`,
        description: "This is a group",
        team_members: [],
        batch: "24/25",
      };

      for (let j = i; j < lastMember; j++) {
        groupData.team_members.push({
          student_id: studentsBatch24_25[j]._id as Types.ObjectId,
          group_role: j % 7 === 0 ? groupRoles[0] : groupRoles[1],
          project_role: getCyclicRoles(projectRoles, j),
        });
      }
      groups.push(groupData);
      if (lastMember === studentsBatch24_25.length) break;
      i += 7;
    }
    i += 7;
    let k = 0;
    // Create groups for batch 25/26
    while (k < studentsBatch25_26.length) {
      let lastMember = 0;
      if (k + 7 < studentsBatch25_26.length) {
        lastMember = k + 7;
      } else if (k + 7 > studentsBatch25_26.length) {
        lastMember = studentsBatch25_26.length;
      }
      let groupData: GroupData = {
        name: `Group ${(k + i) / 7 + 1}`,
        description: "This is a group",
        team_members: [],
        batch: "25/26",
      };

      for (let j = k; j < lastMember; j++) {
        groupData.team_members.push({
          student_id: studentsBatch25_26[j]._id as Types.ObjectId,
          group_role: j % 7 === 0 ? groupRoles[0] : groupRoles[1],
          project_role: getCyclicRoles(projectRoles, j),
        });
      }
      groups.push(groupData);
      if (lastMember === studentsBatch25_26.length) break;
      k += 7;
    }

    // Inserting Groups
    await Group.insertMany(groups, { session });
    console.log("Groups created : Done!");
  } catch (e) {
    // Customize error message
    let customErrorMessage = `
      Error during Groups migration:
      - Reason: Failed to insert group data into the database.
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
