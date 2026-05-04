const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017/sotl";
const inDir = path.resolve(__dirname, "../db-export");

function reviveMongoTypes(value) {
  if (Array.isArray(value)) return value.map(reviveMongoTypes);
  if (!value || typeof value !== "object") return value;

  if (value.$oid) return new mongoose.Types.ObjectId(value.$oid);
  if (value.$date) return new Date(value.$date);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, reviveMongoTypes(entry)])
  );
}

async function main() {
  const manifestPath = path.join(inDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing export manifest: ${manifestPath}`);
  }

  await mongoose.connect(mongoUri);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  for (const { name } of manifest) {
    const filePath = path.join(inDir, `${name}.json`);
    const rawDocs = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const docs = rawDocs.map(reviveMongoTypes);
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
