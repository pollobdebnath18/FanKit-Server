import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";
config();
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.DB_NAME || "FanKitDB");
const orders = await db.collection("orders").find({}).toArray();
for (const o of orders) {
  for (const it of (o.items||[])) {
    console.log(`ITEM: ${it.title}`);
    console.log(`  FULL image: ${it.image}`);
  }
}
await client.close();
