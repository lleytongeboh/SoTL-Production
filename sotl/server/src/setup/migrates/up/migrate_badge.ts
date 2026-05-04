import mongoose, { ClientSession } from "mongoose";
import Badge from "../../../models/Badge"; // Adjust path as needed
import Project from "../../../models/Project"; // Adjust path as needed
import Deliverables from "../../../models/Deliverables"; // Adjust path as needed

// Migration function to insert Deliverables data
export async function migrateBadges(session: ClientSession): Promise<void> {
  try {
    // Get deliverables from batch 24/25
    const deliverables24_25 = await Deliverables.find(
      { batch: "24/25" },
      "_id name",
      { session }
    ).read("primary");

    // Get deliverables from batch 25/26
    const deliverables25_26 = await Deliverables.find(
      { batch: "25/26" },
      "_id name",
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

    const badges = [];
    const color = ["#FFD700", "#BDBDBD", "#B87333", "#3BB842"];
    const badgeNames = ["Badge 1", "Badge 2", "Badge 3", "Badge 4"];

    // add badges 24/25
    for (let i = 4, k = 0; i > 0; i--, k++) {
      let t_deliverable = [];
      for (let j = 0; j <= 7 / i; j++) {
        if (j == 7) break;
        t_deliverable.push(
          deliverables24_25.find(
            (deliverable) =>
              deliverable.name === type_map_deliverable.get(j + 1)
          )
        );
      }

      badges.push({
        name: badgeNames[k],
        deliverable_completion: t_deliverable,
        description: `${badgeNames[k]} description`,
        color: color[k],
        order: k + 1,
        batch: "24/25",
      });
    }

    // add badges 25/26
    for (let i = 4, k = 0; i > 0; i--, k++) {
      let t_deliverable = [];
      for (let j = 0; j <= 7 / i; j++) {
        if (j == 7) break;
        t_deliverable.push(
          deliverables25_26.find(
            (deliverable) =>
              deliverable.name === type_map_deliverable.get(j == 7 ? j : j + 1)
          )
        );
      }

      badges.push({
        name: badgeNames[k],
        deliverable_completion: t_deliverable,
        description: `${badgeNames[k]} description`,
        color: color[k],
        order: k + 1,
        batch: "25/26",
      });
    }

    // Insert the categories into the database within the session
    await Badge.insertMany(badges, { session });

    console.log("Badges migration: Done!");

    const badgesGrouped = await Badge.find({}, "_id deliverable_completion")
      .session(session)
      .read("primary");
    const projects = await Project.find({}, "_id deliverables")
      .session(session)
      .read("primary");

    const dc_map_badge = new Map<string, string>();
    // add deliverable completion and badge to map
    for (const badge of badgesGrouped) {
      dc_map_badge.set(
        badge.deliverable_completion
          .map((x: mongoose.Types.ObjectId) => String(x))
          .join(","),
        String(badge._id)
      );
    }

    // add badge to project
    for (const project of projects) {
      const deliverables = project.deliverables;
      const uniqueDeliverables = deliverables.filter(
        (deliverable, index, self) =>
          index === self.findIndex((d) => d.deliverable_id.equals(deliverable.deliverable_id))
      );

      // Step 2: Sort unique deliverables in ascending order based on _id
      const sortedUniqueDeliverables = uniqueDeliverables.sort(
        (a, b) => String(a.deliverable_id).localeCompare(String(b.deliverable_id)) // Use localeCompare for string sorting
      );

      const cumulativeStrings = sortedUniqueDeliverables.reduce(
        (acc: string[], current) => {
          // Get the current deliverable ID as a string
          const deliverableId = String(current.deliverable_id);

          // If the accumulator is empty, start with the first ID
          if (acc.length === 0) {
            acc.push(deliverableId);
          } else {
            // Concatenate the current deliverable ID with the last entry in the accumulator
            const newString = `${acc[acc.length - 1]},${deliverableId}`;
            acc.push(newString);
          }

          return acc;
        },
        []
      );

      // Find the badge ID for the current project
      for (const cs of cumulativeStrings) {
        const badgeId = dc_map_badge.get(cs);
        if (badgeId) {
          await Project.updateOne(
            { _id: project._id },
            { $push: { badges: badgeId } },
            { session }
          );
        }
      }
    }

    console.log("Project updated with badge: Done!");
    console.log("Badges migration: Done!");
  } catch (error) {
    let errorMessage = `
      Error during Badges migration:
      - Reason: Failed to insert badge data into the database.
    `;
    if (error instanceof Error) {
      errorMessage += `
        - Original Error: ${error.message}
        - Stack Trace: ${error.stack}
      `;
    } else {
      errorMessage += `- Error: ${String(error)}`;
    }
    throw new Error(errorMessage);
  }
}
