import { envVar } from "./env.js";
import { MongoClient } from "mongodb";


export const client = new MongoClient(envVar.MONGODB_URI!);
