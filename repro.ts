import "dotenv/config";
import { auth } from "./src/lib/auth.js";

try {
  const res = await auth.handler(new Request("http://localhost:8000/api/auth/sign-in/social", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify({ provider: "google", callbackURL: "/" }),
  }));
  console.log("STATUS:", res.status);
  console.log("BODY:", await res.text());
} catch (e) {
  console.error("THROWN ERROR:", e?.message);
  console.error("CAUSE:", e?.cause);
  console.error("STACK:", e?.stack);
}
