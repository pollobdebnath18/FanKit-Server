import { MongoClient } from "mongodb";
import { config } from "dotenv";
config();
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.DB_NAME || "FanKitDB");
const orders = await db.collection("orders").find({}).toArray();
for (const o of orders) {
  for (const it of (o.items||[])) {
    const p = await db.collection("products").findOne({ _id: new (await import("mongodb")).ObjectId(it.productId) });
    console.log(`item=${it.productId} stored=${String(it.image).slice(0,45)}`);
    if (p) console.log(`   product exists: imageUrl=${String(p.imageUrl).slice(0,45)} images[0]=${String(p.images?.[0]).slice(0,45)}`);
    else console.log("   PRODUCT MISSING");
  }
}
await client.close();
