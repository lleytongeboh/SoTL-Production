const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/sotl";
const outDir = path.resolve(__dirname, "../db-export");

async function main() {
  await mongoose.connect(mongoUri);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const collections = await mongoose.connection.db.listCollections().toArray();
  const manifest = [];

  for (const collectionInfo of collections) {
    const name = collectionInfo.name;
    const docs = await mongoose.connection.db.collection(name).find({}).toArray();
    fs.writeFileSync(
      path.join(outDir, `${name}.json`),
      EJSON.stringify(docs, null, 2, { relaxed: false })
    );
    manifest.push({ name, count: docs.length });
    console.log(`${name}: ${docs.length}`);
  }

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  await mongoose.disconnect();
  console.log(`Exported to ${outDir}`);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
