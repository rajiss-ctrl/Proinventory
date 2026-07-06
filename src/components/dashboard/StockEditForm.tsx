import { Product } from "../../types";

interface StockEditFormProps {
  item: Product;
  index: number;
  onClose: (index: number) => void;
  onAdd: (id: string, qty: number) => void;
  onMinus: (id: string, qty: number) => void;
  onQtyChange: (value: string) => void;
}

const StockEditForm = ({ item, index, onClose, onAdd, onMinus, onQtyChange }: StockEditFormProps) => (
  <div className="w-full flex flex-col justify-center p-3 md:p-5">
    <h2
      onClick={() => onClose(index)}
      className="text-center mb-8 text-xs md:text-base font-semibold cursor-pointer"
    >
      Manage <span className="text-indigo-700">{item.product_name}</span> stock level
    </h2>
    <input
      type="number"
      name="stock"
      className="py-2 px-4 text-xs outline-none border border-gray-400 sm:text-sm w-full mb-6 rounded"
      onChange={(e) => onQtyChange(e.target.value)}
      placeholder="Enter quantity"
    />
    <div className="flex justify-between gap-2">
      <button
        onClick={() => onClose(index)}
        className="rounded text-xs sm:text-sm border border-red-400 px-3 py-1 text-red-500"
      >
        Cancel
      </button>
      <button
        onClick={() => onAdd(item.id, item.product_Qty)}
        className="rounded text-xs sm:text-sm bg-green-600 px-3 py-1 text-white"
      >
        Add Stock
      </button>
      <button
        onClick={() => onMinus(item.id, item.product_Qty)}
        className="rounded text-xs sm:text-sm bg-[#46148B] px-3 py-1 text-white"
      >
        Minus Sales
      </button>
    </div>
  </div>
);

export default StockEditForm;
