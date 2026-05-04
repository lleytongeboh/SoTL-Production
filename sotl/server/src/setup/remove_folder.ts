import fs from "fs";
import path from "path";

const removeFolder = () => {
  try {
    const PUBLIC_FOLDER = path.resolve("/app/public");
    if (fs.existsSync(PUBLIC_FOLDER)) {
      const files = fs.readdirSync(PUBLIC_FOLDER);

      for (const file of files) {
        const filePath = path.join(PUBLIC_FOLDER, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true }); // Remove folder and its contents
        } else {
          fs.unlinkSync(filePath); // Remove file
        }
      }
      console.log(`Contents of ${PUBLIC_FOLDER} have been removed.`);
    } else {
      console.log(`${PUBLIC_FOLDER} does not exist.`);
    }
  } catch (error: any) {
    console.log(error.message);
  }
};

removeFolder();