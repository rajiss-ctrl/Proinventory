import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import imageCompression from "browser-image-compression";
import db, { storage, useAuth } from "../../services/firebase";
import { FaCloudUploadAlt, FaMoneyBill, FaProductHunt, FaSortNumericUp } from "react-icons/fa";
import StockInputField from "../forms/StockInputField";

interface StockData {
  product_name: string;
  product_Qty: string | number;
  product_Price: string | number;
  size: string;
  product_description: string;
  img?: string;
}

const INPUTS = [
  { id: 1, name: "product_name", type: "text", placeholder: "Product Name", label: "Product Name", icon: <FaProductHunt />, required: true, errMessages: "Product name is required." },
  { id: 2, name: "product_Qty", type: "number", placeholder: "Quantity", label: "Quantity", icon: <FaSortNumericUp />, required: true, errMessages: "Quantity is required." },
  { id: 3, name: "product_Price", type: "number", placeholder: "Price", label: "Price", icon: <FaMoneyBill />, required: true, errMessages: "Price is required." },
  { id: 4, name: "product_description", type: "text", placeholder: "Description", label: "Description", icon: <FaProductHunt />, required: false, errMessages: "" },
];

const EMPTY: StockData = { product_name: "", product_Qty: 0, product_Price: 0, size: "", product_description: "" };

interface AddStockModalProps {
  onClose: () => void;
}

const AddStockModal = ({ onClose }: AddStockModalProps) => {
  const currentUser = useAuth();
  const [data, setData] = useState<StockData>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;
    const task = uploadBytesResumable(ref(storage, `${Date.now()}_${file.name}`), file);
    task.on("state_changed",
      (s) => setProgress((s.bytesTransferred / s.totalBytes) * 100),
      (err) => { setError(err.message); setProgress(null); },
      () => getDownloadURL(task.snapshot.ref).then((url) => { setData((p) => ({ ...p, img: url })); setProgress(null); })
    );
  }, [file]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(jpg|jpeg|png)$/i.test(f.name)) { alert("Only jpg/jpeg/png allowed."); return; }
    setFile(f.size > 1_048_576 ? await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1024 }) : f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.product_name || !data.product_Qty || !data.product_Price || !data.size) {
      setError("Please fill all required fields."); return;
    }
    try {
      await addDoc(collection(db, "stock"), { user_id: currentUser?.uid, timestamp: new Date(), ...data });
      setData(EMPTY); setFile(null); setProgress(null); setError("");
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="bg-black/60 z-[1000] w-full h-full fixed top-0 right-0 flex items-start justify-center overflow-y-auto">
      <div
        className="w-full md:w-[480px] rounded-2xl mx-auto mt-16 p-6"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border-brand)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-5 flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
            Add New Inventory Item
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border-soft)",
            }}
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>

        {progress !== null && progress < 100 && (
          <div className="h-1 mb-3 bg-green-500 transition-all" style={{ width: `${progress}%` }} />
        )}

        <form className="flex flex-col gap-1" onSubmit={handleSubmit}>
          {INPUTS.map((input) => (
            <StockInputField key={input.id} type={input.type} name={input.name}
              placeholder={input.placeholder} required={input.required}
              value={data[input.name as keyof StockData] as string | number}
              onChange={(e) => setData({ ...data, [e.target.name]: e.target.value })}
              errMessages={input.errMessages}
              style={{
                background: "var(--color-input-bg)",
                border: "1px solid var(--color-input-border)",
                color: "var(--color-input-text)",
                borderRadius: "0.5rem",
                padding: "0.625rem 0.75rem",
              }}
            />
          ))}

          <select value={data.size} required name="size"
            onChange={(e) => setData({ ...data, size: e.target.value })}
            className="w-full text-sm rounded-lg p-2.5 outline-none mb-2"
            style={{
              background: "var(--color-input-bg)",
              border: "1px solid var(--color-input-border)",
              color: "var(--color-input-text)",
            }}>
            <option value="" disabled>Choose packaging size</option>
            {["Pack", "Carton", "Piece", "Sachet", "Bag"].map((s) => <option key={s}>{s}</option>)}
          </select>

          <label htmlFor="productImg"
            className="flex items-center text-sm font-medium pb-2 cursor-pointer gap-2"
            style={{ color: "var(--color-brand-primary-soft)" }}>
            <FaCloudUploadAlt /> Upload Item Image
            <input accept="image/*" required id="productImg" type="file"
              className="hidden" onChange={handleFileChange} />
          </label>

          <button type="submit" disabled={progress !== null && progress < 100}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--color-brand-primary)", color: "white" }}>
            Add Item
          </button>
        </form>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default AddStockModal;
