import { useDispatch } from "react-redux";
import type { AppDispatch } from "../app/store";

/** Pre-typed dispatch hook — use instead of plain `useDispatch`. */
const useAppDispatch = () => useDispatch<AppDispatch>();
export default useAppDispatch;
