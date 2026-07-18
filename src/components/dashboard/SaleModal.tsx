import { useState, useEffect } from "react";
import { MdClose, MdShoppingCart, MdAttachMoney } from "react-icons/md";
import { Product } from "../../types";

interface SaleModalProps {
  product: Product;
  companyId: string;
  onClose: () => void;
  onSaleComplete: () => void;
}

interface SaleData {
  quantity: number;
  price: number;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'bank_deposit';
  discount?: number;
  tax?: number;
}

const S: React.CSSProperties = {
  background: "var(--color-input-bg)",
  border: "1px solid var(--color-input-border)",
  color: "var(--color-input-text)",
  borderRadius: "0.75rem",
  padding: "0.625rem 0.875rem",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
};

export const SaleModal = ({ product, companyId, onClose, onSaleComplete }: SaleModalProps) => {
  const [saleData, setSaleData] = useState<SaleData>({
    quantity: 1,
    price: product.product_Price || product.price || 0,
    paymentMethod: 'cash',
    discount: 0,
    tax: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxQuantity, setMaxQuantity] = useState(product.product_Qty || 0);

  const subtotal = saleData.quantity * saleData.price;
  const discountAmount = (subtotal * (saleData.discount || 0)) / 100;
  const taxAmount = ((subtotal - discountAmount) * (saleData.tax || 0)) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (saleData.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (saleData.quantity > maxQuantity) {
      setError(`Only ${maxQuantity} units available in stock`);
      return;
    }

    if (saleData.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      // Import the SalesService (we'll create this next)
      const { SalesService } = await import("../../services/sales.service");
      
      await SalesService.recordSale({
        companyId,
        productId: product.id,
        productName: product.name || product.product_name || "",
        sku: product.sku || "",
        quantity: saleData.quantity,
        price: saleData.price,
        totalAmount: total,
        customerName: saleData.customerName,
        customerEmail: saleData.customerEmail,
        notes: saleData.notes,
        paymentMethod: saleData.paymentMethod,
        discount: saleData.discount || 0,
        tax: saleData.tax || 0,
        createdBy: "system", // Should come from auth context
      });

      onSaleComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-brand)", boxShadow: "var(--shadow-card)" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--color-brand-primary-soft)" }}>
              <MdShoppingCart size={20} style={{ color: "var(--color-brand-primary)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Record Sale
              </h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {product.name || product.product_name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "var(--color-text-muted)" }}
          >
            <MdClose size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                max={maxQuantity}
                value={saleData.quantity}
                onChange={(e) => setSaleData(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
                required
                style={S}
              />
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                Available: {maxQuantity} units
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Price per Unit *
              </label>
              <input
                type="number"
                step="0.01"
                min={0.01}
                value={saleData.price}
                onChange={(e) => setSaleData(prev => ({ ...prev, price: Number(e.target.value) }))}
                required
                style={S}
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Customer Name
              </label>
              <input
                type="text"
                value={saleData.customerName || ""}
                onChange={(e) => setSaleData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Walk-in Customer"
                style={S}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Customer Email
              </label>
              <input
                type="email"
                value={saleData.customerEmail || ""}
                onChange={(e) => setSaleData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="customer@email.com"
                style={S}
              />
            </div>
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={saleData.discount}
                onChange={(e) => setSaleData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                style={S}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Tax (%)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={saleData.tax}
                onChange={(e) => setSaleData(prev => ({ ...prev, tax: Number(e.target.value) }))}
                style={S}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Payment Method *
            </label>
            <select
              value={saleData.paymentMethod}
              onChange={(e) => setSaleData(prev => ({ ...prev, paymentMethod: e.target.value as SaleData['paymentMethod'] }))}
              style={S}
              required
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Bank Transfer</option>
              <option value="bank_deposit">Bank Deposit</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Notes
            </label>
            <textarea
              value={saleData.notes || ""}
              onChange={(e) => setSaleData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this sale..."
              rows={2}
              style={{ ...S, resize: "vertical" }}
            />
          </div>

          {/* Totals Summary */}
          <div className="rounded-lg p-3 space-y-1"
            style={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border-soft)" }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
              <span style={{ color: "var(--color-text-primary)" }}>${subtotal.toFixed(2)}</span>
            </div>
            {saleData.discount && saleData.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Discount ({saleData.discount}%)</span>
                <span style={{ color: "var(--color-danger)" }}>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            {saleData.tax && saleData.tax > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Tax ({saleData.tax}%)</span>
                <span style={{ color: "var(--color-text-primary)" }}>+${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold pt-1 border-t"
              style={{ borderColor: "var(--color-border-subtle)" }}>
              <span style={{ color: "var(--color-text-primary)" }}>Total</span>
              <span style={{ color: "var(--color-brand-primary-soft)" }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: "transparent",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border-soft)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: "var(--color-brand-primary)",
                color: "white",
              }}
            >
              <MdAttachMoney size={16} />
              {loading ? "Recording..." : "Complete Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};