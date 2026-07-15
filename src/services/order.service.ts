/**
 * order.service.ts
 * CRUD for companies/{companyId}/orders/{orderId}
 */
import {
  collection, doc, setDoc, getDoc,
  updateDoc, deleteDoc, getDocs,
  query, where, orderBy,
} from "firebase/firestore";
import db from "./firebase";
import { Order, OrderItem } from "../types";
import { StockMovementService } from "./stock-movement.service";
import { ProductService } from "./product.service";

let _counter = 1;
const nextOrderNumber = () => `ORD-${String(_counter++).padStart(4, "0")}`;

export interface CreateOrderInput {
  companyId:    string;
  createdBy:    string;
  customerName: string;
  items:        OrderItem[];
  warehouseId?: string;
}

export const OrderService = {

  async create(input: CreateOrderInput): Promise<Order> {
    const ref   = doc(collection(db, "companies", input.companyId, "orders"));
    const total = input.items.reduce((s, i) => s + i.qty * i.price, 0);
    const data: Omit<Order, "id"> = {
      orderNumber:  nextOrderNumber(),
      customerName: input.customerName,
      items:        input.items,
      totalAmount:  total,
      status:       "pending",
      companyId:    input.companyId,
      createdBy:    input.createdBy,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    };
    await setDoc(ref, data);
    console.log(`✅ [OrderService] orders/${ref.id} created`);
    return { id: ref.id, ...data };
  },

  /** Mark order as completed — deducts stock and logs movements */
  async complete(companyId: string, orderId: string, createdBy: string, warehouseId = "main_warehouse"): Promise<void> {
    const snap = await getDoc(doc(db, "companies", companyId, "orders", orderId));
    if (!snap.exists()) throw new Error("Order not found");
    const order = { id: snap.id, ...snap.data() } as Order;

    for (const item of order.items) {
      const product = await ProductService.get(companyId, item.productId).catch(() => null);
      const before  = product?.stockQuantity ?? 0;
      const after   = Math.max(0, before - item.qty);
      await ProductService.update(companyId, item.productId, { stockQuantity: after });
      await StockMovementService.log({
        companyId, createdBy,
        productId: item.productId, productName: item.name, sku: product?.sku ?? "",
        warehouseId, type: "sale",
        quantity: -item.qty, balanceBefore: before, balanceAfter: after,
        reference: orderId,
      });
    }

    await updateDoc(doc(db, "companies", companyId, "orders", orderId), {
      status: "completed", updatedAt: new Date(),
    });
  },

  async get(companyId: string, orderId: string): Promise<Order> {
    const snap = await getDoc(doc(db, "companies", companyId, "orders", orderId));
    if (!snap.exists()) throw new Error(`Order not found: ${orderId}`);
    return { id: snap.id, ...snap.data() } as Order;
  },

  async list(companyId: string): Promise<Order[]> {
    const snap = await getDocs(
      query(collection(db, "companies", companyId, "orders"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  },

  async updateStatus(companyId: string, orderId: string, status: Order["status"]): Promise<void> {
    await updateDoc(doc(db, "companies", companyId, "orders", orderId), {
      status, updatedAt: new Date(),
    });
  },

  async delete(companyId: string, orderId: string): Promise<void> {
    await deleteDoc(doc(db, "companies", companyId, "orders", orderId));
  },
};
