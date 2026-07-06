import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { collection, getDocs } from "firebase/firestore";
import db from "../../services/firebase";
import { CurrentUser, CurrentUserState } from "../../types";

export const fetchUsers = createAsyncThunk<CurrentUser[]>(
  "auth/fetchUsers",
  async () => {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map((doc) => doc.data() as CurrentUser);
  }
);

const stored = sessionStorage.getItem("currentUser");

const initialState: CurrentUserState = {
  user: stored ? (JSON.parse(stored) as CurrentUser) : null,
  users: [],
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<CurrentUser>) {
      state.user = action.payload;
      sessionStorage.setItem("currentUser", JSON.stringify(action.payload));
    },
    clearCurrentUser(state) {
      state.user = null;
      sessionStorage.removeItem("currentUser");
    },
    addUsers(state, action: PayloadAction<CurrentUser[]>) {
      state.users = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? null;
      });
  },
});

export const { setCurrentUser, clearCurrentUser, addUsers } = authSlice.actions;
export default authSlice.reducer;
