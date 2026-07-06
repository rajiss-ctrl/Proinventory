import { useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import db, { useAuth } from "./services/firebase";
import { setStockData } from "./features/stock/stockSlice";
import { setBusinessData } from "./features/business/businessSlice";
import useAppDispatch from "./hooks/useAppDispatch";
import AppRouter from "./app/router";
import { Product } from "./types";
import { BusinessProfile } from "./types";

/**
 * App sets up global Firestore real-time listeners tied to the
 * authenticated user, then delegates all routing to AppRouter.
 */
const App = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAuth();

  // Real-time stock listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "stock"),
      where("user_id", "==", currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as Product)
      );
      dispatch(setStockData(items));
    });
    return unsubscribe;
  }, [currentUser?.uid, dispatch]);

  // Real-time business profile listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "businesses"),
      where("user_id", "==", currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profiles: BusinessProfile[] = snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as BusinessProfile)
      );
      dispatch(setBusinessData(profiles));
    });
    return unsubscribe;
  }, [currentUser?.uid, dispatch]);

  return <AppRouter />;
};

export default App;
