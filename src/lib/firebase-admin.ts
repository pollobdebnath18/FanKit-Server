import admin from "firebase-admin";
import { ObjectId } from "mongodb";
import { collections } from "./db.js";
import { env } from "./env.js";

const serviceAccount = (() => {
  const parsed = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

  if (parsed) {
    try {
      return JSON.parse(parsed) as admin.ServiceAccount;
    } catch (error) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON", error);
    }
  }

  return {
    projectId: env.FIREBASE_PROJECT_ID || undefined,
    clientEmail: env.FIREBASE_CLIENT_EMAIL || undefined,
    privateKey: (env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  } as admin.ServiceAccount;
})();

const hasAdminConfig = Boolean(
  serviceAccount.projectId &&
  serviceAccount.clientEmail &&
  serviceAccount.privateKey,
);

if (hasAdminConfig && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const ensureAdminReady = () => {
  if (!hasAdminConfig) {
    throw new Error(
      "Firebase Admin is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_* admin env values.",
    );
  }
};

export const getAuthenticatedUserProfile = async (token: string) => {
  try {
    ensureAdminReady();
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";
    const name = decodedToken.name || email.split("@")[0] || "FanKit User";

    let user = await collections.users().findOne({ firebaseUid });

    if (!user && email) {
      user = await collections.users().findOne({ email });
    }

    if (!user) {
      const insertResult = await collections.users().insertOne({
        _id: new ObjectId(),
        name,
        email,
        firebaseUid,
        role: "user",
        phone: "",
        avatar: decodedToken.picture || "",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user = await collections
        .users()
        .findOne({ _id: insertResult.insertedId });
    }

    if (user && !user.firebaseUid) {
      await collections.users().updateOne(
        { _id: user._id },
        {
          $set: {
            firebaseUid,
            avatar: decodedToken.picture || user.avatar || "",
            emailVerified: true,
            updatedAt: new Date(),
          },
        },
      );

      user = await collections.users().findOne({ _id: user._id });
    }

    if (!user) {
      return null;
    }

    return {
      firebaseUid,
      userId: user._id.toHexString(),
      user: {
        id: user._id.toHexString(),
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.avatar,
      },
    };
  } catch {
    return null;
  }
};

export const updateFirebasePassword = async (
  firebaseUid: string,
  newPassword: string,
) => {
  ensureAdminReady();
  await admin.auth().updateUser(firebaseUid, { password: newPassword });
};

export const updateFirebaseProfile = async (
  firebaseUid: string,
  payload: {
    displayName?: string;
    photoURL?: string;
  },
) => {
  ensureAdminReady();
  await admin.auth().updateUser(firebaseUid, payload);
};

export const getFirebaseUidFromObjectId = async (id: string) => {
  const user = await collections.users().findOne({ _id: new ObjectId(id) });
  return user?.firebaseUid ?? null;
};

export const getFirebaseAccountState = async (email: string) => {
  try {
    ensureAdminReady();
    const record = await admin.auth().getUserByEmail(email.toLowerCase());
    const hasPassword = record.providerData.some(
      (provider) => provider.providerId === "password",
    );
    return { exists: true, hasPassword };
  } catch {
    return { exists: false, hasPassword: false };
  }
};

export const verifyFirebasePassword = async (
  email: string,
  password: string,
): Promise<boolean> => {
  const apiKey = env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
};
