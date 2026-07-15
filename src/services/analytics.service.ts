/**
 * analytics.service.ts
 * Aggregates data from Firestore subcollections for dashboard metrics.
 */
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import db from "./firebase";
import { Product, Order, StockMovement } from "../types";

export interface DashboardMetrics {
  totalInventoryValue: number;
  totalStockItems:     number;
  outOfStockCount:     number;
  lowStockCount:       number;
  pendingOrdersCount:  number;
  totalOrdersValue:    number;
  recentMovements:     StockMovement[];
}

export const AnalyticsService = {

  async getDashboardMetrics(companyId: string): Promise<DashboardMetrics> {
    const [productsSnap, ordersSnap, movementsSnap] = await Promise.all([
      getDocs(collection(db, "companies", companyId, "products")),
      getDocs(query(
        collection(db, "companies", companyId, "orders"),
        where("status", "==", "pending")
      )),
      getDocs(query(
        collection(db, "companies", companyId, "stockMovements"),
        orderBy("createdAt", "desc"),
        limit(10)
      )),
    ]);

    const products  = productsSnap.docs.map((d)  => ({ id: d.id,  ...d.data()  } as Product));
    const movements = movementsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement));

    const totalInventoryValue = products.reduce((s, p) => s + (p.stockQuantity ?? 0) * (p.price ?? 0), 0);
    const totalStockItems     = products.reduce((s, p) => s + (p.stockQuantity ?? 0), 0);
    const outOfStockCount     = products.filter((p) => (p.stockQuantity ?? 0) === 0).length;
    const lowStockCount       = products.filter((p) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 10).length;

    return {
      totalInventoryValue,
      totalStockItems,
      outOfStockCount,
      lowStockCount,
      pendingOrdersCount: ordersSnap.size,
      totalOrdersValue:   0,
      recentMovements:    movements,
    };
  },

  async getTopProducts(companyId: string, n = 5): Promise<Product[]> {
    const snap = await getDocs(collection(db, "companies", companyId, "products"));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Product))
      .sort((a, b) => (b.stockQuantity ?? 0) * (b.price ?? 0) - (a.stockQuantity ?? 0) * (a.price ?? 0))
      .slice(0, n);
  },

  async getLowStockProducts(companyId: string, threshold = 10): Promise<Product[]> {
    const snap = await getDocs(
      query(collection(db, "companies", companyId, "products"),
            where("stockQuantity", "<=", threshold))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  },
};
