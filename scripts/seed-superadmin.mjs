/**
 * scripts/seed-superadmin.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME seed script — creates the super admin Firebase Auth account and
 * writes the users/{uid} Firestore document with isSuperAdmin: true.
 *
 * Run ONCE:
 *   node scripts/seed-superadmin.mjs
 *
 * After running successfully:
 *   1. Remove VITE_SUPERADMIN_EMAIL and VITE_SUPERADMIN_PASSWORD from .env
 *   2. This script is safe to keep in the repo (it contains no secrets).
 *
 * IDEMPOTENT — safe to run again: if the account already exists it updates
 * the Firestore doc without throwing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env manually (no dotenv dependency needed) ────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");

const envVars = {};
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key   = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    envVars[key] = value;
  }
} catch {
  console.error("❌  Could not read .env file. Make sure it exists at project root.");
  process.exit(1);
}

// ── Validate required vars ───────────────────────────────────────────────────
const REQUIRED = [
  "VITE_FIREBASE_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_SUPERADMIN_EMAIL",
  "VITE_SUPERADMIN_PASSWORD",
];

const missing = REQUIRED.filter((k) => !envVars[k]);
if (missing.length > 0) {
  console.error("❌  Missing required env vars:", missing.join(", "));
  process.exit(1);
}

const {
  VITE_FIREBASE_KEY:                  apiKey,
  VITE_FIREBASE_AUTH_DOMAIN:          authDomain,
  VITE_FIREBASE_PROJECT_ID:           projectId,
  VITE_FIREBASE_STORAGE_BUCKET:       storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID:  messagingSenderId,
  VITE_FIREBASE_APP_ID:               appId,
  VITE_SUPERADMIN_EMAIL:              adminEmail,
  VITE_SUPERADMIN_PASSWORD:           adminPassword,
} = envVars;

// ── Firebase client SDK (already installed in node_modules) ─────────────────
import { initializeApp }                from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword }
  from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const app  = initializeApp({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId });
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Super admin Firestore profile ────────────────────────────────────────────
const buildProfile = (uid) => ({
  uid,
  email:        adminEmail,
  displayName:  "Super Admin",
  companyId:    "platform",          // sentinel value — not a real company
  role:         "super_admin",
  status:       "active",
  isSuperAdmin: true,
  permissions: {
    dashboard:      { read: true },
    products:       { read: true, write: true, delete: true },
    categories:     { read: true, write: true, delete: true },
    orders:         { read: true, write: true, delete: true },
    purchaseOrders: { read: true, write: true, delete: true },
    stock:          { read: true, write: true, delete: true, adjust: true },
    suppliers:      { read: true, write: true, delete: true },
    customers:      { read: true, write: true, delete: true },
    reports:        { read: true, write: true, delete: true },
    settings:       { read: true, write: true, delete: true },
    users:          { read: true, write: true, delete: true },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("\n🌱  ProInventory — Super Admin Seed Script");
  console.log("─".repeat(52));
  console.log(`   Project : ${projectId}`);
  console.log(`   Email   : ${adminEmail}`);
  console.log("─".repeat(52));

  let uid;

  // Step 1 — create or sign in to the Firebase Auth account
  try {
    const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    uid = cred.user.uid;
    console.log(`\n✅  Firebase Auth account CREATED`);
    console.log(`    UID : ${uid}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      // Account exists — sign in to get the UID
      const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      uid = cred.user.uid;
      console.log(`\n⚠️   Firebase Auth account already exists — using existing UID`);
      console.log(`    UID : ${uid}`);
    } else {
      console.error("\n❌  Failed to create Auth account:", err.message);
      process.exit(1);
    }
  }

  // Step 2 — write / overwrite users/{uid} with isSuperAdmin: true
  const profile = buildProfile(uid);
  const userRef = doc(db, "users", uid);

  try {
    const existing = await getDoc(userRef);
    await setDoc(userRef, profile, { merge: true });

    if (existing.exists()) {
      console.log("\n✅  users/{uid} Firestore document UPDATED (merge)");
    } else {
      console.log("\n✅  users/{uid} Firestore document CREATED");
    }

    console.log("\n📄  Document written:");
    console.log(JSON.stringify(profile, null, 2));
  } catch (err) {
    console.error("\n❌  Failed to write Firestore document:", err.message);
    process.exit(1);
  }

  // Step 3 — remind user to clean up
  console.log("\n─".repeat(52));
  console.log("🎉  Super admin seeded successfully!\n");
  console.log("⚠️   NEXT STEPS:");
  console.log("    1. Remove VITE_SUPERADMIN_EMAIL from .env");
  console.log("    2. Remove VITE_SUPERADMIN_PASSWORD from .env");
  console.log("    3. Keep this script in the repo (it contains no secrets)");
  console.log("─".repeat(52) + "\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
