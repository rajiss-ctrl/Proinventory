import { ReactNode } from "react";

// ─── Firebase / Firestore ────────────────────────────────────────────────────

export interface FirebaseTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

// ─── Domain models ───────────────────────────────────────────────────────────

export interface Product {
  id: string;
  user_id: string;
  product_name: string;
  product_Qty: number;
  product_Price: number;
  product_description?: string;
  size: string;
  img?: string;
  initialStock?: number;
  timestamp?: FirebaseTimestamp | Date | null;
  dateStamp?: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  businessName: string;
  businessType?: string;
  businessAddress: string;
  about?: string;
  mission?: string;
  logo?: string;
}

export interface CurrentUser {
  uid: string;
  email: string | null;
}

// ─── Redux state shapes ──────────────────────────────────────────────────────

export interface ProductState {
  productData: Product[];
  isLoading: boolean;
}

export interface BusinessState {
  buzProfileData: BusinessProfile[];
  isLoading: boolean;
}

export interface CurrentUserState {
  user: CurrentUser | null;
  users: CurrentUser[];
  status: string;
  error: string | null | undefined;
}

export interface UserState {
  user: CurrentUser[];
  status: string;
  error: string | null | undefined;
}

export interface ModalState {
  isOpen: boolean;
}

// ─── Component prop types ────────────────────────────────────────────────────

export interface InputConfig {
  id: number;
  name: string;
  type: string;
  placeholder: string;
  label: string;
  errMessages?: string;
  successMessage?: string;
  pattern?: string;
  required: boolean;
  icon?: ReactNode;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface StockInputField {
  id: number;
  name: string;
  type: string;
  placeholder: string;
  label: string;
  errMessages?: string;
  required: boolean;
}
