import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import db from "../../services/firebase";
import { CurrentUser, CurrentUserState, UserProfile, DEFAULT_PERMISSIONS } from "../../types";

/**
 * Fetch the global user profile from users/{uid}
 * Returns the UserProfile which contains companyId.
 */
export const fetchUserProfile = createAsyncThunk<UserProfile, string>(
  "auth/fetchUserProfile",
  async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      // Guest account or new user — return a minimal owner-level profile
      console.warn("⚠️ [authSlice] No users/{uid} doc found — using guest/owner defaults.");
      return {
        uid,
        email: "",
        displayName: "Guest",
        companyId: `guest_company_${uid}`,
        role: "guest" as const,
        status: "active" as const,
        isSuperAdmin: false,
        permissions: DEFAULT_PERMISSIONS["guest"],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserProfile;
    }
    const data = { ...snap.data(), uid: snap.id } as UserProfile;
    console.log("✅ [authSlice] users/{uid} profile fetched:", data);
    return data;
  }
);

export const fetchUsers = createAsyncThunk<CurrentUser[]>(
  "auth/fetchUsers",
  async () => {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map((d) => d.data() as CurrentUser);
  }
);

const stored = sessionStorage.getItem("currentUser")
  || localStorage.getItem("currentUser");

const initialState: CurrentUserState = {
  user:    stored ? (JSON.parse(stored) as CurrentUser) : null,
  profile: null,
  users:   [],
  status:  "idle",
  error:   null,
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
      state.user    = null;
      state.profile = null;
      sessionStorage.removeItem("currentUser");
      localStorage.removeItem("currentUser");
    },
    addUsers(state, action: PayloadAction<CurrentUser[]>) {
      state.users = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending,   (state) => { state.status = "loading"; })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status  = "succeeded";
        state.profile = action.payload;
        // Merge companyId into the current user object for convenience
        if (state.user) {
          state.user = {
            ...state.user,
            companyId:   action.payload.companyId,
            displayName: action.payload.displayName,
            role:        action.payload.role,
          };
          sessionStorage.setItem("currentUser", JSON.stringify(state.user));
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error  = action.error.message ?? null;
        console.warn("⚠️ [authSlice] Failed to fetch user profile:", action.error.message);
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      });
  },
});

export const { setCurrentUser, clearCurrentUser, addUsers } = authSlice.actions;
export default authSlice.reducer;
