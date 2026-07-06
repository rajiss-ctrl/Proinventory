import { Product } from "../../types";

interface DeleteConfirmProps {
  item: Product;
  index: number;
  onCancel: (index: number) => void;
  onConfirm: (id: string) => void;
}

const DeleteConfirm = ({ item, index, onCancel, onConfirm }: DeleteConfirmProps) => (
  <div onClick={() => onCancel(index)} className="text-white p-[10px]">
    <p className="text-center text-gray-500 text-sm">
      Delete <span className="text-green-600 font-medium">{item.product_name}</span>?
    </p>
    <div className="flex justify-between mt-2">
      <button className="border border-blue-500 text-blue-500 px-3 py-1 text-xs rounded">
        Cancel
      </button>
      <button
        onClick={() => onConfirm(item.id)}
        className="bg-red-500 text-white px-3 py-1 text-xs rounded"
      >
        Delete
      </button>
    </div>
  </div>
);

export default DeleteConfirm;
