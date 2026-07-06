import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import stockReducer from "../features/stock/stockSlice";
import businessReducer from "../features/business/businessSlice";
import modalReducer from "../features/ui/modalSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stock: stockReducer,
    business: businessReducer,
    modal: modalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
