import { useState } from "react";
import { Line } from "react-chartjs-2";
import { useSelector } from "react-redux";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, Title, Tooltip, Legend,
} from "chart.js";
import { RootState } from "../../app/store";
import { Product, FirebaseTimestamp } from "../../types";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const THRESHOLD = 1000;

function daysFromTimestamp(ts: FirebaseTimestamp | Date | string | null | undefined): number {
  if (!ts) return 0;
  const date =
    typeof (ts as FirebaseTimestamp).toDate === "function"
      ? (ts as FirebaseTimestamp).toDate()
      : new Date(ts as string);
  if (!date || isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

const StockChart = () => {
  const [alertOpen, setAlertOpen] = useState(true);
  const products = useSelector((s: RootState) => s.stock.productData);

  const labels = products.map((p: Product) => p.product_name ?? p.name);
  const qtys = products.map((p: Product) => p.product_Qty ?? p.stockQuantity ?? 0);
  const sales = products.map((p: Product) =>
    p.initialStock !== undefined ? p.initialStock - (p.product_Qty ?? p.stockQuantity ?? 0) : 0
  );
  const days = products.map((p: Product) => daysFromTimestamp(p.timestamp ?? null));

  const data = {
    labels,
    datasets: [
      { label: "Stock Level", data: qtys, fill: false, borderWidth: 2,
        borderColor: qtys.map((q) => (q < THRESHOLD ? "#FF5733" : "#4c51bf")),
        backgroundColor: qtys.map((q) => (q < THRESHOLD ? "#FF5733" : "#4c51bf")), },
      { label: "Sales Level", data: sales, fill: false, borderWidth: 2,
        borderColor: sales.map((s) => (s < 100 ? "#FF6347" : "#3edd3e")),
        backgroundColor: sales.map((s) => (s < 100 ? "#FF6347" : "#3edd3e")), },
      { label: `Days to Threshold (${THRESHOLD})`, data: days, fill: false,
        borderWidth: 2, borderColor: "#FFA500", backgroundColor: "#FFA500" },
    ],
  };

  const fastMoving = products.filter((p: Product) => (p.product_Qty ?? p.stockQuantity ?? 0) <= THRESHOLD && p.timestamp);

  return (
    <>
      {alertOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="max-w-lg w-full bg-[#1C1C1E] rounded-xl p-6 shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-[#86E372] font-bold"
              onClick={() => setAlertOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h6 className="text-xl font-extrabold text-[#FEBC1F] mb-4 text-center">
              Inventory Alert: Limited Stock / Low Sales
            </h6>
            <p className="text-sm text-[#7B7B7B] text-center mb-4">
              {new Date().toLocaleString("en-US", {
                weekday: "long", month: "long", day: "numeric",
                year: "numeric", hour: "numeric", minute: "numeric",
              })}
            </p>
            <p className="text-sm text-[#DEDFFB] text-center mb-6">
              Some products have low stock or sales. Review the inventory.
            </p>
            <button
              className="block mx-auto bg-gradient-to-r from-[#02F7A6] to-[#14FFFF] text-white px-6 py-3 rounded-lg"
              onClick={() => setAlertOpen(false)}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <div className="relative flex flex-col min-w-0 break-words w-full md:mb-6 rounded">
        <p className="uppercase text-slate-500 text-xs mt-4 font-bold px-4">
          Stock &amp; Sales Overview —{" "}
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
        <div className="relative sm:p-4">
          <Line data={data} />
        </div>
        <ul className="list-disc list-inside text-gray-700 mt-2 px-4 pb-4 text-xs">
          {fastMoving.map((p: Product) => {
            const ts = p.timestamp ?? null;
            const d =
              ts && typeof (ts as FirebaseTimestamp).toDate === "function"
                ? (ts as FirebaseTimestamp).toDate()
                : ts ? new Date(ts as unknown as string) : null;
            const count = d && !isNaN(d.getTime()) ? daysFromTimestamp(d) : "N/A";
            return (
              <li key={p.id}>
                <span className="font-bold">{p.product_name ?? p.name}</span> stocked on{" "}
                <span className="text-blue-700">{d?.toLocaleDateString() ?? "Unknown"}</span> —{" "}
                hit {THRESHOLD} units in{" "}
                <span className="text-red-600">{count} {typeof count === "number" && count !== 1 ? "days" : "day"}</span>.
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default StockChart;
