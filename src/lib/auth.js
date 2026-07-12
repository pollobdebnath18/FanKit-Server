"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const mongodb_1 = require("mongodb");
const mongodb_2 = require("better-auth/adapters/mongodb");
const client = new mongodb_1.MongoClient("mongodb://localhost:27017/database");
const db = client.db();
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, mongodb_2.mongodbAdapter)(db, {
        // Optional: if you don't provide a client, database transactions won't be enabled.
        client,
    }),
    emailAndPassword: {
        enabled: true,
    },
});
//# sourceMappingURL=auth.js.map