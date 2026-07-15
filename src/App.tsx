import { useEffect } from "react";
import { onSnapshot, collection, doc } from "firebase/firestore";
import db, { useAuth } from "./services/firebase";
import { PlatformAdminService } from "./services/platform-admin.service";
import { setStockData }    from "./features/stock/stockSlice";
import { setBusinessData } from "./features/business/businessSlice";
import { setCompany }      from "./features/company/companySlice";
import { setCurrentUser, fetchUserProfile } from "./features/auth/authSlice";
import useAppDispatch   from "./hooks/useAppDispatch";
import useAppSelector   from "./hooks/useAppSelector";
import AppRouter        from "./app/router";
import { Product, Company } from "./types";

/**
 * Firestore Schema
 * ─────────────────────────────────────────────────────────────
 *  users/{uid}
 *  companies/{companyId}
 *  companies/{companyId}/users/{uid}
 *  companies/{companyId}/warehouses/{warehouseId}
 *  companies/{companyId}/categories/{categoryId}
 *  companies/{companyId}/products/{productId}
 *  companies/{companyId}/inventory/{inventoryId}
 *  companies/{companyId}/orders/{orderId}
 *  companies/{companyId}/transfers/{transferId}
 *  companies/{companyId}/transfers/{transferId}/items/{itemId}
 *  companies/{companyId}/stockMovements/{movementId}
 *  companies/{companyId}/suppliers/{supplierId}
 *  companies/{companyId}/customers/{customerId}
 *  companies/{companyId}/settings/general
 *  companies/{companyId}/settings/roles
 * ─────────────────────────────────────────────────────────────
 */

// ── Helper: convert any Firestore Timestamp fields to ISO strings ──────────
const toISO = (v: any): any => {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
};

const serializeDoc = (data: Record<string, any>) => ({
  ...data,
  createdAt: toISO(data.createdAt),
  updatedAt: toISO(data.updatedAt),
  timestamp: toISO(data.timestamp),
});
const logRootCollections = async () => {
  try {
    const [users, companies] = await Promise.all([
      PlatformAdminService.listAllUsers(),
      PlatformAdminService.listAllCompanies(),
    ]);
    console.groupCollapsed(`📦 [App] "users" — ${users.length} document(s)`);
    users.forEach((u, i) => console.log(`  [${i}]`, u));
    console.groupEnd();

    console.groupCollapsed(`📦 [App] "companies" — ${companies.length} document(s)`);
    companies.forEach((c, i) => console.log(`  [${i}]`, c));
    console.groupEnd();
  } catch (err) {
    console.warn("⚠️ [App] Could not log root collections:", err);
  }
};

const App = () => {
  const dispatch      = useAppDispatch();
  const firebaseUser  = useAuth();
  const reduxUser     = useAppSelector((s) => s.auth.user);

  // ── Step 1: Auth resolved → sync Redux + fetch Firestore profile ──────────
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

    // ── Sync auth to Redux + fetch profile ──────────────────
    dispatch(setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email ?? "" }));
    dispatch(fetchUserProfile(firebaseUser.uid));
    console.log("🔄 [App] Fetching user profile for uid:", firebaseUser.uid);

  }, [firebaseUser?.uid, dispatch]);

  // ── Step 2: companyId resolved → attach real-time Firestore listeners ─────
  const companyId = reduxUser?.companyId;

  useEffect(() => {
    if (!companyId) return;

    console.log("🏢 [App] companyId resolved:", companyId);
    console.log("📡 [App] Attaching listeners:", {
      company:  `companies/${companyId}`,
      products: `companies/${companyId}/products`,
    });

    const unsubs: (() => void)[] = [];

    // ── Listener A: companies/{companyId} ─────────────────────────────────
    unsubs.push(
      onSnapshot(
        doc(db, "companies", companyId),
        (snap) => {
          if (!snap.exists()) {
            console.warn(`⚠️ [App] companies/${companyId} does not exist.`);
            return;
          }

          const raw = snap.data();
          const company: Company = {
            id: snap.id,
            name: raw.name ?? "",
            slug: raw.slug ?? "",
            email: raw.email ?? "",
            phone: raw.phone,
            industry: raw.industry,
            plan: raw.plan ?? "starter",
            status: raw.status ?? "trial",
            trialEndsAt: toISO(raw.trialEndsAt) ?? new Date().toISOString(),
            subscriptionStatus: raw.subscriptionStatus ?? "trialing",
            ownerId: raw.ownerId ?? "",
            createdAt: toISO(raw.createdAt) ?? new Date().toISOString(),
            updatedAt: toISO(raw.updatedAt) ?? new Date().toISOString(),
          };

          const serializableCompany = {
            ...company,
            createdAt: toISO(raw.createdAt) ?? new Date().toISOString(),
            updatedAt: toISO(raw.updatedAt) ?? new Date().toISOString(),
            trialEndsAt: toISO(raw.trialEndsAt) ?? new Date().toISOString(),
          };

          console.group(`✅ [App] companies/${companyId}`);
          console.log(serializableCompany);
          console.groupEnd();
          dispatch(setCompany(serializableCompany as Company));
          dispatch(setBusinessData([{ ...serializableCompany, businessName: serializableCompany.name, businessAddress: "", logo: "" }]));
        },
        (err) => console.error("❌ [App] company listener:", err)
      )
    );

    // ── Listener B: companies/{companyId}/products ────────────────────────
    unsubs.push(
      onSnapshot(
        collection(db, "companies", companyId, "products"),
        (snap) => {
          const products: Product[] = snap.docs.map((d) => {
            const raw = d.data() as Record<string, unknown>;
            const productName = typeof raw.name === "string" ? raw.name : typeof raw.product_name === "string" ? raw.product_name : "";
            const sku = typeof raw.sku === "string" ? raw.sku : `SKU-${d.id.slice(0, 6).toUpperCase()}`;
            const categoryName = typeof raw.categoryName === "string" ? raw.categoryName : typeof raw.product_description === "string" ? raw.product_description : "";
            const price = typeof raw.price === "number" ? raw.price : typeof raw.product_Price === "number" ? raw.product_Price : 0;
            const stockQuantity = typeof raw.stockQuantity === "number" ? raw.stockQuantity : typeof raw.product_Qty === "number" ? raw.product_Qty : 0;
            const status = typeof raw.status === "string" ? raw.status : "in_stock";
            const imageUrl = typeof raw.imageUrl === "string" ? raw.imageUrl : typeof raw.img === "string" ? raw.img : "";
            const createdAt = toISO(raw.createdAt);
            const updatedAt = toISO(raw.updatedAt);

            return {
              id: d.id,
              name: productName,
              sku,
              categoryId: typeof raw.categoryId === "string" ? raw.categoryId : "",
              categoryName,
              price,
              stockQuantity,
              status: status as Product["status"],
              imageUrl,
              companyId: typeof raw.companyId === "string" ? raw.companyId : companyId,
              createdBy: typeof raw.createdBy === "string" ? raw.createdBy : "",
              createdAt,
              updatedAt,
              product_name: productName,
              product_Qty: stockQuantity,
              product_Price: price,
              product_description: categoryName,
              size: typeof raw.size === "string" ? raw.size : "Piece",
              img: imageUrl,
              initialStock: typeof raw.initialStock === "number" ? raw.initialStock : undefined,
              timestamp: toISO(raw.timestamp),
            } as Product;
          });

          console.group(`✅ [App] companies/${companyId}/products — ${products.length} item(s)`);
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
