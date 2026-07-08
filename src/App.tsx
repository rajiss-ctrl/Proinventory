import { useEffect } from "react";
import {
  doc,
  collection,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import db, { useAuth } from "./services/firebase";
import { setStockData }    from "./features/stock/stockSlice";
import { setBusinessData } from "./features/business/businessSlice";
import { setCompany }      from "./features/company/companySlice";
import { setCurrentUser, fetchUserProfile } from "./features/auth/authSlice";
import useAppDispatch from "./hooks/useAppDispatch";
import useAppSelector from "./hooks/useAppSelector";
import AppRouter from "./app/router";
import { Product, Company } from "./types";

/* ─────────────────────────────────────────────────────────────
   Firestore Schema
   ─────────────────────────────────────────────────────────────
   users/{uid}                           → global user profile
   companies/{companyId}                 → company info
   companies/{companyId}/products/{id}   → inventory products
   companies/{companyId}/categories/{id} → product categories
   companies/{companyId}/orders/{id}     → orders
   companies/{companyId}/users/{uid}     → company members
   ───────────────────────────────────────────────────────────── */

/** One-time fetch + console.log of an entire collection for inspection */
const logCollection = async (path: string) => {
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      console.warn(`📭 [App] "${path}" collection is empty.`);
      return;
    }
    const docs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    console.groupCollapsed(`📦 [App] "${path}" — ${docs.length} document(s)`);
    docs.forEach((d, i) => console.log(`  [${i}]`, d));
    console.groupEnd();
  } catch (err) {
    console.error(`❌ [App] Failed to read "${path}":`, err);
  }
};

const App = () => {
  const dispatch     = useAppDispatch();
  const firebaseUser = useAuth();
  const reduxUser    = useAppSelector((s) => s.auth.user);

  // ── Step 1: Auth resolved → log both root collections, sync Redux, fetch profile
  useEffect(() => {
    if (firebaseUser === undefined) return; // Firebase still initialising

    if (!firebaseUser) {
      console.log("🔓 [App] No authenticated user.");
      return;
    }

    console.log("🔑 [App] Firebase Auth user:", {
      uid:   firebaseUser.uid,
      email: firebaseUser.email,
    });

    // ── LOG THE TWO ROOT COLLECTIONS ────────────────────────
    console.group("🗂️ [App] Reading root Firestore collections…");
    logCollection("users");
    logCollection("companies");
    console.groupEnd();

    // Only sync auth state if we don't already have a role set
    // (guest sets role before App.tsx fires — preserve it)
    const existingUser = reduxUser;
    if (!existingUser?.role) {
      dispatch(setCurrentUser({
        uid:   firebaseUser.uid,
        email: firebaseUser.email ?? "",
      }));
      // Fetch profile from users/{uid} — gives companyId, role, permissions
      dispatch(fetchUserProfile(firebaseUser.uid));
      console.log("🔄 [App] No role in store — fetching user profile.");
    } else {
      console.log("⏭️ [App] Role already in store:", existingUser.role, "— skipping profile fetch.");
    }

  }, [firebaseUser?.uid, dispatch]);

  // ── Step 2: companyId resolved → attach real-time listeners
  const companyId = reduxUser?.companyId;

  useEffect(() => {
    // Skip fake guest company IDs — guest has no real Firestore company doc
    if (!companyId || companyId.startsWith("guest_company_")) {
      if (companyId?.startsWith("guest_company_")) {
        console.log("👤 [App] Guest session — skipping Firestore company listeners.");
      }
      return;
    }

    console.log("🏢 [App] companyId resolved:", companyId);
    console.log("📡 [App] Attaching Firestore listeners:", {
      company:  `companies/${companyId}`,
      products: `companies/${companyId}/products`,
    });

    const unsubs: (() => void)[] = [];

    // ── Listener A: companies/{companyId} document ──────────
    unsubs.push(
      onSnapshot(
        doc(db, "companies", companyId),
        (snap) => {
          if (!snap.exists()) {
            console.warn(`⚠️ [App] companies/${companyId} does not exist.`);
            return;
          }
          const company = { id: snap.id, ...snap.data() } as Company;

          console.group(`✅ [App] companies/${companyId}`);
          console.log(company);
          console.groupEnd();

          dispatch(setCompany(company));
          dispatch(setBusinessData([company as any])); // legacy compat
        },
        (err) => console.error("❌ [App] company listener:", err)
      )
    );

    // ── Listener B: companies/{companyId}/products ───────────
    unsubs.push(
      onSnapshot(
        collection(db, "companies", companyId, "products"),
        (snap) => {
          const products: Product[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id:             d.id,
              // ── New schema fields ──
              name:           data.name          ?? data.product_name ?? "",
              sku:            data.sku           ?? `SKU-${d.id.slice(0, 6).toUpperCase()}`,
              categoryId:     data.categoryId    ?? "",
              categoryName:   data.categoryName  ?? data.product_description ?? "",
              price:          data.price         ?? data.product_Price ?? 0,
              stockQuantity:  data.stockQuantity ?? data.product_Qty   ?? 0,
              status:         data.status        ?? "in_stock",
              imageUrl:       data.imageUrl      ?? data.img ?? "",
              companyId:      data.companyId     ?? companyId,
              createdBy:      data.createdBy     ?? "",
              createdAt:      data.createdAt,
              updatedAt:      data.updatedAt,
              // ── Legacy compat (keeps existing UI components working) ──
              product_name:         data.name          ?? data.product_name,
              product_Qty:          data.stockQuantity ?? data.product_Qty,
              product_Price:        data.price         ?? data.product_Price,
              product_description:  data.categoryName  ?? data.product_description,
              size:                 data.size          ?? "Piece",
              img:                  data.imageUrl      ?? data.img,
            } as Product;
          });

          console.group(
            `✅ [App] companies/${companyId}/products — ${products.length} item(s)`
          );
          products.forEach((p, i) => console.log(`  [${i}]`, p));
          console.groupEnd();

          dispatch(setStockData(products));
        },
        (err) => console.error("❌ [App] products listener:", err)
      )
    );

    return () => {
      console.log("🧹 [App] Unsubscribing listeners for companyId:", companyId);
      unsubs.forEach((fn) => fn());
    };
  }, [companyId, dispatch]);

  return <AppRouter />;
};

export default App;
