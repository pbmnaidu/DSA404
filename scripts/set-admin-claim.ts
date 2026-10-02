/**
 * set-admin-claim.ts
 *
 * One-time setup script to assign the Firebase custom claim { admin: true }
 * to the designated admin account.
 *
 * Usage:
 *   ADMIN_EMAIL=<email> npx ts-node --skip-project scripts/set-admin-claim.ts
 *
 * Or set ADMIN_EMAIL in your .env and run:
 *   npx dotenv -e .env -- npx ts-node --skip-project scripts/set-admin-claim.ts
 *
 * Required env vars (same ones the Next.js app uses):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *   ADMIN_EMAIL  — the email to grant admin access to
 *
 * SECURITY: This script must NEVER be run from the browser.
 *           It uses the Firebase Admin SDK with service-account credentials.
 */

import * as dotenv from "dotenv";
dotenv.config();

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function sanitize(val?: string): string | undefined {
  if (!val) return undefined;
  let c = val.trim();
  if ((c.startsWith('"') && c.endsWith('"')) || (c.startsWith("'") && c.endsWith("'"))) {
    c = c.slice(1, -1).trim();
  }
  return c;
}

async function main() {
  const adminEmail = sanitize(process.env.ADMIN_EMAIL);
  if (!adminEmail) {
    console.error("ERROR: ADMIN_EMAIL environment variable is required.");
    process.exit(1);
  }

  const projectId = sanitize(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = sanitize(process.env.FIREBASE_CLIENT_EMAIL);
  let privateKey = sanitize(process.env.FIREBASE_PRIVATE_KEY);
  if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("ERROR: Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.");
    process.exit(1);
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const auth = getAuth(app);

  try {
    const user = await auth.getUserByEmail(adminEmail);
    console.log(`Found user: uid=${user.uid}, email=${user.email}`);

    // Set the custom claim
    await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
    console.log(`✅ Custom claim { admin: true } set for uid=${user.uid}`);

    // Verify
    const updated = await auth.getUser(user.uid);
    console.log("Current claims:", updated.customClaims);

    console.log("\nIMPORTANT: The user must sign out and sign back in (or force-refresh");
    console.log("their token) for the new claim to take effect in the browser.");
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      console.error(`ERROR: No Firebase Auth user found with email: ${adminEmail}`);
      console.error("The user must register first, then run this script.");
    } else {
      console.error("ERROR:", err.message || err);
    }
    process.exit(1);
  }
}

main();
