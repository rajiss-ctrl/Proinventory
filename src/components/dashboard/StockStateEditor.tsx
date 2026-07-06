import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import db from "../../services/firebase";

interface StockStateEditorProps {
  id: string;
  qty: number;
  price: number;
  des?: string;
  siz: string;
  stockState: number;
  index: number;
  onClose: ((e: React.MouseEvent, index: number) => void) | (() => void);
  onDelete: (e: React.MouseEvent, id: string) => void;
}

interface FormData {
  [key: string]: string | number | undefined;
}

const StockStateEditor = ({
  id, qty, price, des, siz,
  stockState, index, onClose, onDelete,
}: StockStateEditorProps) => {
  const [data, setData] = useState<FormData>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fields = [
    { id: 1, name: "product_Qty", type: "number", label: "Product Quantity",
      placeholder: `Stock: ${stockState === index ? qty : ""} ${siz}`, required: true },
    { id: 2, name: "product_Price", type: "number", label: "Product Price",
      placeholder: `Cost: ₦${stockState === index ? price : ""}`, required: true },
    { id: 3, name: "product_description", type: "text", label: "Description",
      placeholder: stockState === index ? (des ?? "") : "", required: false },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdate = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "stock", id), { ...data, dateStamp: new Date().toISOString() });
    } catch (err) {
      alert((err as Error).message);
    }
    setData({});
  };

  return (
    <div
      className="w-[280px] rounded-xl p-5 text-sm relative z-50"
      style={{
        background: "var(--color-surface-3)",
        border: "1px solid var(--color-border-brand)",
        boxShadow: "var(--shadow-card)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
        Edit Product
      </h3>
      <form className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.id} className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{f.label}</label>
            <input
              type={f.type}
              name={f.name}
              value={(data[f.name] as string) ?? ""}
              onChange={handleChange}
              placeholder={f.placeholder}
              required={f.required}
              className="rounded-lg p-2 text-sm outline-none"
              style={{
                background: "var(--color-input-bg)",
                border: "1px solid var(--color-input-border)",
                color: "var(--color-input-text)",
              }}
            />
          </div>
        ))}

        <select
          name="size"
          value={(data.size as string) ?? ""}
          onChange={handleChange}
          required
          className="rounded-lg p-2 text-sm outline-none"
          style={{
            background: "var(--color-input-bg)",
            border: "1px solid var(--color-input-border)",
            color: "var(--color-input-text)",
          }}
        >
          <option value="" disabled>{siz || "Packaging size"}</option>
          {["Pack", "Carton", "Piece", "Sachet", "Bag"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={(e) => {
            handleUpdate(e);
            if (onClose.length === 0) (onClose as () => void)();
            else (onClose as (e: React.MouseEvent, i: number) => void)(e, index);
          }}
          className="flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm"
          style={{ background: "var(--color-brand-primary)", color: "white" }}
        >
          <FaCheck size={12} /> Update
        </button>

        <button
          onClick={(e) => { e.preventDefault(); setShowDeleteConfirm((p) => !p); }}
          className="py-2 rounded-lg font-semibold text-sm"
          style={{
            background: "var(--color-surface-4)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border-soft)",
          }}
        >
          Delete Product
        </button>

        {showDeleteConfirm && (
          <div
            className="absolute top-16 right-4 p-3 rounded-xl flex items-center gap-2 z-50"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-danger-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <button onClick={(e) => onDelete(e, id)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: "var(--color-danger)", color: "white" }}>
              <FaTrash size={12} />
            </button>
            <button onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: "var(--color-surface-3)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-soft)" }}>
              <FaTimes size={12} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default StockStateEditor;
