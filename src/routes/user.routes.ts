// import { Router } from "express";
// import { auth } from "../lib/auth.js";
// import { client } from "../lib/mongodb.js";
// import { envVar } from "../lib/env.js";

// const router = Router();

// router.get("/me", async (req, res) => {
//   try {
//     const session = await auth.api.getSession({
//       headers: req.headers,
//     });

//     if (!session) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const user = await client.db(envVar.DB_NAME).collection("user").findOne({
//       email: session.user.email,
//     });

//     res.json(user);
//   } catch (error) {
//     res.status(500).json({
//       message: "Server Error",
//     });
//   }
// });

// export default router;
