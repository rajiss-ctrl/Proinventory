import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Company, CompanyState } from "../../types";

const initialState: CompanyState = {
  company:   null,
  companyId: null,
  isLoading: false,   // start false — only true while actively fetching
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCompany(state, action: PayloadAction<Company>) {
      state.company   = action.payload;
      state.companyId = action.payload.id;
      state.isLoading = false;
    },
    setCompanyLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearCompany(state) {
      state.company   = null;
      state.companyId = null;
      state.isLoading = false;
    },
  },
});

export const { setCompany, setCompanyLoading, clearCompany } = companySlice.actions;
export default companySlice.reducer;
