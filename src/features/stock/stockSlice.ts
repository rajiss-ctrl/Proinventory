import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product, ProductState } from "../../types";

const initialState: ProductState = {
  productData: [],
  isLoading: true,
};

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    setStockData(state, action: PayloadAction<Product[]>) {
      state.productData = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setStockData } = stockSlice.actions;
export default stockSlice.reducer;
