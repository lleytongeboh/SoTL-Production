const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017/sotl";
const inDir = path.resolve(__dirname, "../db-export");

async function main() {
  const manifestPath = path.join(inDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing export manifest: ${manifestPath}`);
  }

  await mongoose.connect(mongoUri);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  for (const { name } of manifest) {
    const filePath = path.join(inDir, `${name}.json`);
    const docs = EJSON.parse(fs.readFileSync(filePath, "utf8"), {
      relaxed: false,
    });
    const collection = mongoose.connection.db.collection(name);

    await collection.deleteMany({});
    if (docs.length > 0) await collection.insertMany(docs, { ordered: false });
    console.log(`${name}: imported ${docs.length}`);
  }

  await mongoose.disconnect();
  console.log("Import completed");
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
