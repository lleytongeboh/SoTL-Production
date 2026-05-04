import { ClientSession } from "mongoose";
import { hashPassword } from "../../../utils";
import Group from "../../../models/Group";
import Client from "../../../models/Client";
import { faker } from "@faker-js/faker";

export async function migrateClients(session: ClientSession): Promise<void> {
  try {
    // Define plain passwords
    const plainPassword = "123456789";

    // Hash passwords asynchronously
    const hashedPassword = await hashPassword(plainPassword);
    // Load client data from JSON file

    // Extracting Projects
    const groupProjects = await Group.find({
      project: { $exists: true, $ne: null },
    })
      .session(session)
      .read("primary");

    // Check if projects exist
    if (!groupProjects) {
      throw new Error("GroupProjects not found");
    }
    //console.log("Group Projects:", groupProjects);

    const clients = [];

    for (const groupProject of groupProjects) {
      let clientData = {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        designation: faker.person.jobTitle(),
        company: faker.company.name(),
        role: "client",
        password: hashedPassword,
        batch: groupProject.batch,
        project: groupProject.project,
      };
      clients.push(clientData);
    }

    // Inserting Clients
    await Client.insertMany(clients, { session });
    console.log("Clients created : Done!");
  } catch (e: unknown) {
    // Customize error message
    const customErrorMessage = `
      Error during Clients migration:
      - Reason: Failed to insert client data into the database.
      - Original Error: ${(e as Error).message}
      - Stack Trace: ${(e as Error).stack}
    `;
    throw new Error(customErrorMessage); // Rethrow with customized message
  }
}
