/**
 * notification.service.ts
 * CRUD for companies/{companyId}/notifications/{notificationId}
 */
import {
  collection, doc, setDoc, getDocs,
  query, where, orderBy, limit,
  updateDoc, deleteDoc, getDoc,
  serverTimestamp, QueryDocumentSnapshot,
  getCountFromServer, startAfter,
} from "firebase/firestore";
import db from "./firebase";

export interface Notification {
  id: string;
  type: 'transfer_request' | 'transfer_completed' | 'transfer_cancelled' | 'stock_alert' | 'system';
  title: string;
  message: string;
  transferId?: string;
  transferNumber?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  items?: any[];
  totalItems?: number;
  notes?: string;
  status: 'unread' | 'read';
  createdAt: any;
  createdBy: string;
  readAt: any | null;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  totalCount: number;
  lastVisible: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const NotificationService = {
  /**
   * Create a new notification
   */
  async create(companyId: string, data: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const ref = doc(collection(db, "companies", companyId, "notifications"));
    const notification = {
      ...data,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, notification);
    return ref.id;
  },

  /**
   * Get all notifications for a company with pagination
   */
  async list(
    companyId: string,
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot,
    statusFilter?: 'unread' | 'read' | 'all'
  ): Promise<PaginatedNotifications> {
    const ref = collection(db, "companies", companyId, "notifications");
    
    let q = query(
      ref,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (statusFilter && statusFilter !== 'all') {
      q = query(q, where("status", "==", statusFilter));
    }

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    let countQuery = ref;
    if (statusFilter && statusFilter !== 'all') {
      countQuery = query(ref, where("status", "==", statusFilter));
    }
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    const snap = await getDocs(q);
    const notifications = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Notification[];

    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return {
      notifications,
      totalCount,
      lastVisible: lastDoc,
      hasMore: snap.docs.length === pageSize,
    };
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(companyId: string): Promise<number> {
    const ref = collection(db, "companies", companyId, "notifications");
    const q = query(ref, where("status", "==", "unread"));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(companyId: string, notificationId: string): Promise<void> {
    const ref = doc(db, "companies", companyId, "notifications", notificationId);
    await updateDoc(ref, {
      status: 'read',
      readAt: serverTimestamp(),
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(companyId: string): Promise<void> {
    const ref = collection(db, "companies", companyId, "notifications");
    const q = query(ref, where("status", "==", "unread"));
    const snap = await getDocs(q);
    
    const updates = snap.docs.map((doc) => 
      updateDoc(doc.ref, {
        status: 'read',
        readAt: serverTimestamp(),
      })
    );
    
    await Promise.all(updates);
  },

  /**
   * Delete a notification
   */
  async delete(companyId: string, notificationId: string): Promise<void> {
    const ref = doc(db, "companies", companyId, "notifications", notificationId);
    await deleteDoc(ref);
  },

  /**
   * Delete all notifications
   */
  async deleteAll(companyId: string): Promise<void> {
    const ref = collection(db, "companies", companyId, "notifications");
    const snap = await getDocs(ref);
    const deletions = snap.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletions);
  },
};