import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BusinessProfile, BusinessState } from "../../types";

const initialState: BusinessState = {
  buzProfileData: [],
  isLoading: true,
};

const businessSlice = createSlice({
  name: "business",
  initialState,
  reducers: {
    setBusinessData(state, action: PayloadAction<BusinessProfile[]>) {
      state.buzProfileData = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setBusinessData } = businessSlice.actions;
export default businessSlice.reducer;
