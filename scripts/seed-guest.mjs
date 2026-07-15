/**
 * scripts/seed-guest.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME seed — creates a real Firestore users/{uid} document and a real
 * companies/{companyId} document for the guest/demo account so it has the
 * same full privileges as a normal company_owner subscriber.
 *
 * Run ONCE:
 *   npm run seed:guest
 *
 * IDEMPOTENT — safe to re-run.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env ────────────────────────────────────────────────────────────────
const __dir  = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(resolve(__dir, "../.env"), "utf8");
const env    = {};

for (const line of envRaw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
}

// ── Validate ─────────────────────────────────────────────────────────────────
const REQUIRED = [
  "VITE_FIREBASE_KEY", "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_APP_ID",
  "VITE_GUEST_EMAIL", "VITE_GUEST_PASSWORD",
];
const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length) { console.error("❌  Missing:", missing.join(", ")); process.exit(1); }

// ── Firebase ─────────────────────────────────────────────────────────────────
import { initializeApp }   from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword }
  from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection } from "firebase/firestore";

const app  = initializeApp({
  apiKey:            env.VITE_FIREBASE_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Full owner permissions (same as company_owner) ───────────────────────────
const OWNER_PERMISSIONS = {
  dashboard:      { read: true },
  products:       { read: true, write: true, delete: true },
  categories:     { read: true, write: true, delete: true },
  orders:         { read: true, write: true, delete: true },
  purchaseOrders: { read: true, write: true, delete: true },
  stock:          { read: true, write: true, delete: true, adjust: true },
  suppliers:      { read: true, write: true, delete: true },
  customers:      { read: true, write: true, delete: true },
  reports:        { read: true, write: true, delete: false },
  settings:       { read: true, write: true, delete: false },
  users:          { read: true, write: true, delete: true },
};

// ── Seed primary guest account only ─────────────────────────────────────────
const accounts = [
  { email: env.VITE_GUEST_EMAIL, password: env.VITE_GUEST_PASSWORD, label: "Primary Guest" },
];

async function seedGuest({ email, password, label }) {
  console.log(`\n─── ${label} (${email}) ───`);

  // Step 1 — get UID
  let uid;
  try {
    const c = await createUserWithEmailAndPassword(auth, email, password);
    uid = c.user.uid;
    console.log(`✅  Auth account CREATED  uid: ${uid}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const c = await signInWithEmailAndPassword(auth, email, password);
      uid = c.user.uid;
      console.log(`⚠️   Auth account EXISTS   uid: ${uid}`);
    } else {
      console.error(`❌  Auth error: ${err.message}`);
      return;
    }
  }

  // Step 2 — deterministic companyId so re-runs are idempotent
  const companyId = `cmp_guest_${uid.slice(0, 8)}`;

  // Step 3 — write companies/{companyId}
  const companyData = {
    name:               "Demo Company",
    slug:               `demo-company-${uid.slice(0, 6)}`,
    email,
    phone:              "",
    industry:           "Demo",
    plan:               "most_popular",
    status:             "active",          // guest = permanently active
    subscriptionStatus: "active",          // bypasses trial check
    trialEndsAt:        null,              // no trial expiry for guests
    ownerId:            uid,
    createdAt:          new Date(),
    updatedAt:          new Date(),
  };
  await setDoc(doc(db, "companies", companyId), companyData, { merge: true });
  console.log(`✅  companies/${companyId}  written`);

  // Step 4 — write users/{uid}
  const userProfile = {
    uid,
    email,
    displayName:  "Guest User",
    companyId,
    role:         "company_owner",   // treated exactly as a normal owner
    status:       "active",
    isSuperAdmin: false,
    permissions:  OWNER_PERMISSIONS,
    createdAt:    new Date(),
    updatedAt:    new Date(),
  };
  await setDoc(doc(db, "users", uid), userProfile, { merge: true });
  console.log(`✅  users/${uid}  written`);

  // Step 5 — write companies/{companyId}/users/{uid}
  await setDoc(
    doc(db, "companies", companyId, "users", uid),
    {
      uid, email,
      displayName: "Guest User",
      companyId,
      role:        "company_owner",
      status:      "active",
      permissions: OWNER_PERMISSIONS,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    },
    { merge: true }
  );
  console.log(`✅  companies/${companyId}/users/${uid}  written`);

  // Step 6 — seed a small demo inventory so the dashboard is immediately useful
  const demoProducts = [
    {
      id: "demo-laptop",
      name: "Demo Laptop",
      sku: "SKU-LAP-001",
      categoryId: "electronics",
      categoryName: "Electronics",
      price: 899,
      stockQuantity: 12,
      status: "in_stock",
      imageUrl: "",
      companyId,
      createdBy: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      product_name: "Demo Laptop",
      product_Qty: 12,
      product_Price: 899,
      product_description: "Electronics",
      size: "Piece",
      img: "",
    },
    {
      id: "demo-socks",
      name: "Demo Socks",
      sku: "SKU-SOCK-001",
      categoryId: "apparel",
      categoryName: "Apparel",
      price: 18,
      stockQuantity: 8,
      status: "low_stock",
      imageUrl: "",
      companyId,
      createdBy: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      product_name: "Demo Socks",
      product_Qty: 8,
      product_Price: 18,
      product_description: "Apparel",
      size: "Pack",
      img: "",
    },
    {
      id: "demo-water",
      name: "Demo Water",
      sku: "SKU-WTR-001",
      categoryId: "groceries",
      categoryName: "Groceries",
      price: 4,
      stockQuantity: 0,
      status: "out_of_stock",
      imageUrl: "",
      companyId,
      createdBy: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      product_name: "Demo Water",
      product_Qty: 0,
      product_Price: 4,
      product_description: "Groceries",
      size: "Sachet",
      img: "",
    },
  ];

  for (const product of demoProducts) {
    await setDoc(doc(db, "companies", companyId, "products", product.id), product, { merge: true });
  }

  console.log(`✅  seeded ${demoProducts.length} demo products under companies/${companyId}/products`);
  console.log(`\n    companyId : ${companyId}`);
  console.log(`    role      : company_owner  (full privileges)`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log("\n🌱  ProInventory — Guest Account Seed Script");
console.log("─".repeat(52));
console.log(`   Project: ${env.VITE_FIREBASE_PROJECT_ID}`);

for (const account of accounts) {
  await seedGuest(account);
}

console.log("\n─".repeat(52));
console.log("🎉  Guest seed complete!");
console.log("\n    Guest accounts now have role: company_owner");
console.log("    with a real companyId and full Firestore permissions.\n");
process.exit(0);
