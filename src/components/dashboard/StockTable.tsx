import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { FaArrowDown, FaMinus } from "react-icons/fa";
import db from "../../services/firebase";
import { RootState } from "../../app/store";
import { Product, BusinessProfile } from "../../types";
import StockStateEditor from "./StockStateEditor";
import AddStockModal from "./AddStockModal";
import Spinner from "../../assets/img/spinner.svg";

interface StockTableProps {
  onNewItem?: () => void;
  showNewItemForm?: boolean;
}

interface ConfirmProps {
  item: Product;
  index: number;
  onConfirm: (e: React.MouseEvent, id: string, qty: number) => void;
  onDecline: (e: React.MouseEvent, index: number) => void;
}

const SalesConfirmation = ({ item, index, onConfirm, onDecline }: ConfirmProps) => (
  <div className="animate-fade-up bg-white shadow-2xl font-semibold rounded flex flex-col items-center p-2 gap-2">
    <p className="text-slate-500 text-xs">Confirm Sale?</p>
    <div className="flex gap-2">
      <button onClick={(e) => onConfirm(e, item.id, item.product_Qty)}
        className="bg-green-600 text-white text-[10px] px-2 py-1 rounded">Confirm</button>
      <button onClick={(e) => onDecline(e, index)}
        className="bg-red-500 text-white text-[10px] px-2 py-1 rounded">Decline</button>
    </div>
  </div>
);

const StockTable = ({ onNewItem, showNewItemForm }: StockTableProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "StockTrack Inventory",
  });

  const location = useLocation();
  const isInventoryView = location.pathname === "/dashboard";

  const [salesIdx, setSalesIdx] = useState(-1);
  const [editIdx, setEditIdx] = useState(-1);
  const [saleQty, setSaleQty] = useState(0);
  const [currency, setCurrency] = useState("₦");

  const products = useSelector((s: RootState) => s.stock.productData);
  const business = useSelector((s: RootState) => s.business.buzProfileData);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setCurrency(coords.latitude > 0 ? "₦" : "$");
    });
  }, []);

  const handleMinus = async (e: React.MouseEvent, id: string, qty: number) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "stock", id), { product_Qty: Number(qty) - Number(saleQty) });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaleQty(0);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    try { await deleteDoc(doc(db, "stock", id)); }
    catch (err) { alert((err as Error).message); }
  };

  const toggleSales = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    setSalesIdx((p) => (p === idx ? -1 : idx));
  };

  const toggleEdit = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    setEditIdx((p) => (p === idx ? -1 : idx));
  };

  return (
    <>
      <div className={`relative flex flex-col min-w-0 wrap-break-word bg-white w-full mb-2 rounded ${isInventoryView ? "xl:mt-8" : "mt-0 md:min-h-screen"}`}>
        {showNewItemForm && onNewItem && <AddStockModal onClose={onNewItem} />}

        {/* Brand logo row */}
        <div className="flex px-4 items-center justify-end pt-2">
          {business.map((b: BusinessProfile) => (
            <img key={b.id} className="w-8 rounded-full" src={b.logo} alt={b.businessName} />
          ))}
        </div>

        <div ref={printRef}>
          {/* Table header row */}
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap sm:px-2 sm:pb-5 items-center justify-between">
              <h3 className="font-semibold text-base text-gray-700">INVENTORY</h3>
              <Link to={isInventoryView ? "/dashboard" : "/dashboard"}
                className="bg-[#46148B] text-white text-xs font-bold uppercase px-3 py-1 rounded">
                {isInventoryView ? "Dashboard" : "See all"}
              </Link>
            </div>
          </div>

          <div className="block w-full overflow-x-auto">
            <table className="items-center w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  {["", "Product", "Qty", "Size", "Price", "Total / Action"].map((h) => (
                    <th key={h} className="px-4 bg-gray-50 text-gray-500 border-y py-3 text-xs uppercase font-semibold text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center pt-6">
                      <img src={Spinner} alt="loading" className="w-16 mx-auto" />
                    </td>
                  </tr>
                ) : (
                  products.map((item: Product, idx: number) => {
                    const total = Number(item.product_Qty) * Number(item.product_Price);
                    return (
                      <tr key={item.id}
                        onClick={(e) => toggleEdit(e as unknown as React.MouseEvent, idx)}
                        className="cursor-pointer hover:bg-slate-50 border-b">
                        {/* Image */}
                        <td className="px-4 py-2 text-xs">
                          <div className={`${editIdx === idx ? "block" : "hidden"} absolute mt-14 lg:mt-0 flex justify-center items-center top-0 w-full left-0 bg-transparent`}>
                            <StockStateEditor id={item.id} qty={item.product_Qty ?? 0} price={item.product_Price ?? 0}
                              stockState={editIdx} index={idx} onClose={toggleEdit} onDelete={handleDelete} />
                          </div>
                          {item.img
                            ? <img src={item.img} alt={item.product_name} className="w-8 h-8 rounded-md" />
                            : <img src={Spinner} alt="loading" className="w-8 h-8" />}
                        </td>
                        <td className="px-4 py-2 text-xs">{item.product_name}</td>
                        <td className="px-4 py-2 text-xs">{item.product_Qty}</td>
                        <td className="px-4 py-2 text-xs">{item.product_Qty <= 1 ? item.size : `${item.size}s`}</td>
                        <td className="px-4 py-2 text-xs">{currency}{item.product_Price.toLocaleString()}</td>
                        <td className="px-4 py-2 text-xs relative">
                          {!isInventoryView ? (
                            <span className="font-semibold">{currency}{total.toLocaleString()}</span>
                          ) : (
                            <form className="flex items-center" onSubmit={(e) => e.preventDefault()}>
                              <input onChange={(e) => setSaleQty(Number(e.target.value))}
                                placeholder="Sales qty" type="number"
                                className="w-24 bg-slate-100 outline-none border py-1 px-2 text-xs" />
                              <button onClick={(e) => toggleSales(e, idx)}
                                className="bg-green-500 border font-bold rounded-r-md py-[0.42rem] px-3 text-white">
                                <span className="hidden md:block"><FaArrowDown /></span>
                                <span className="md:hidden"><FaMinus /></span>
                              </button>
                              <div className={`${salesIdx === idx ? "block" : "hidden"} absolute -top-2 right-4 z-10`}>
                                <SalesConfirmation item={item} index={idx}
                                  onConfirm={(e, id, qty) => { toggleSales(e, idx); handleMinus(e, id, qty); }}
                                  onDecline={toggleSales} />
                              </div>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isInventoryView && (
          <div className="pl-4 mt-8">
            <button onClick={() => handlePrint()}
              className="bg-[#46148B] rounded-lg text-sm py-2 px-4 text-white hover:opacity-90">
              Print
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default StockTable;
