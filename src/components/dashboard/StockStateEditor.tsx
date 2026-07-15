import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import db from "../../services/firebase";

export interface StockStateEditorProps {
  id: string;
  qty: number;
  price: number;
  des?: string;
  siz?: string;
  stockState: number;
  index: number;
  companyId?: string;
  canEditPrice?: boolean;
  canDelete?: boolean;
  onClose: ((e: React.MouseEvent, index: number) => void) | (() => void);
  onDelete?: (e: React.MouseEvent, id: string) => void | Promise<void>;
}

interface FormData {
  [key: string]: string | number | undefined;
}

const StockStateEditor = ({
  id, qty, price, des, siz,
  stockState, index, companyId,
  canEditPrice = false,
  canDelete = false,
  onClose, onDelete,
}: StockStateEditorProps) => {
  const [data, setData] = useState<FormData>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const closeModal = (e?: React.MouseEvent) => {
    if (!onClose) return;
    if (onClose.length === 0) {
      (onClose as () => void)();
      return;
    }

    (onClose as (e: React.MouseEvent, i: number) => void)(e ?? ({} as React.MouseEvent), index);
  };

  const fields = [
    {
      id: 1,
      name: "product_Qty",
      type: "number",
      label: "Quantity to add",
      placeholder: `Current stock: ${stockState === index ? qty : 0}`,
      required: true,
      min: 0,
    },
    ...(canEditPrice
      ? [{
          id: 2,
          name: "product_Price",
          type: "number",
          label: "Product Price",
          placeholder: `Current price: ₦${stockState === index ? price : 0}`,
          required: true,
          min: 0,
        }]
      : []),
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUpdate = async (e: React.MouseEvent) => {
    e.preventDefault();
    const payload: Record<string, number | string | Date> = {};
    const currentQty = Number(qty ?? 0);

    if (data.product_Qty !== undefined && data.product_Qty !== "") {
      const incomingQty = Number(data.product_Qty);
      const nextQty = Math.max(0, currentQty + incomingQty);
      payload.stockQuantity = nextQty;
      payload.product_Qty = nextQty;
    }

    if (canEditPrice && data.product_Price !== undefined && data.product_Price !== "") {
      const priceValue = Number(data.product_Price);
      payload.price = priceValue;
      payload.product_Price = priceValue;
    }

    if (des !== undefined && data.product_description !== undefined && data.product_description !== "") {
      payload.product_description = String(data.product_description);
    }

    if (siz && data.size !== undefined && data.size !== "") {
      payload.size = String(data.size);
    }

    if (Object.keys(payload).length === 0) {
      setData({});
      return;
    }

    try {
      const targetDoc = companyId
        ? doc(db, "companies", companyId, "products", id)
        : doc(db, "stock", id);

      await updateDoc(targetDoc, {
        ...payload,
        updatedAt: new Date(),
      });
    } catch (err) {
      alert((err as Error).message);
    }

    setData({});
  };

  return (
    <div
      className="w-[320px] rounded-xl p-5 text-sm relative z-50"
      style={{
        background: "var(--color-surface-3)",
        border: "1px solid var(--color-border-brand)",
        boxShadow: "var(--shadow-card)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Update Product
        </h3>
        <button
          type="button"
          aria-label="Close product update modal"
          onClick={(e) => {
            e.preventDefault();
            closeModal(e);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg"
          style={{
            background: "var(--color-surface-4)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border-soft)",
          }}
        >
          <FaTimes size={12} />
        </button>
      </div>
      <form className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.id} className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{f.label}</label>
            <input
              type={f.type}
              name={f.name}
              min={f.min}
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

        <button
          type="button"
          onClick={async (e) => {
            await handleUpdate(e);
            closeModal(e);
          }}
          className="flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm"
          style={{ background: "var(--color-brand-primary)", color: "white" }}
        >
          <FaCheck size={12} /> Update Stock
        </button>

        {canDelete && onDelete && (
          <>
            <button
              type="button"
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
                <button type="button" onClick={(e) => onDelete(e, id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: "var(--color-danger)", color: "white" }}>
                  <FaTrash size={12} />
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: "var(--color-surface-3)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-soft)" }}>
                  <FaTimes size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
};

export default StockStateEditor;
