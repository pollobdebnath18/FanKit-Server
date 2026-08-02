import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";
config();
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.DB_NAME || "FanKitDB");
const orders = await db.collection("orders").find({}).toArray();
let updated = 0;
for (const o of orders) {
  let changed = false;
  const items = (o.items || []).map((it) => {
    const resolved = it.image;
    if (ObjectId.isValid(it.productId)) return it;
    return it;
  });
  for (const it of items) {
    if (!ObjectId.isValid(it.productId)) continue;
    const p = await db.collection("products").findOne({ _id: new ObjectId(it.productId) });
    const fallback = p?.imageUrl ?? p?.images?.[0] ?? "";
    if (fallback && fallback !== it.image) {
      console.log(`  ${o.orderNumber} | ${it.title.slice(0,35)}`);
      console.log(`    old: ${String(it.image).slice(0,60)}`);
      console.log(`    new: ${String(fallback).slice(0,60)}`);
      it.image = fallback;
      changed = true;
    }
  }
  if (changed) {
    await db.collection("orders").updateOne({ _id: o._id }, { $set: { items } });
    updated++;
  }
}
console.log(`orders updated: ${updated}`);
await client.close();
