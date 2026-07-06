import { useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState } from "../app/store";

/** Pre-typed selector hook — use instead of plain `useSelector`. */
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export default useAppSelector;
