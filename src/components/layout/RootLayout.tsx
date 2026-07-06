import { Outlet } from "react-router-dom";

const RootLayout = () => (
  <div
    className="overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100 flex flex-col min-h-screen"
    style={{ scrollbarWidth: "thin", scrollbarColor: "#3b82f6 #eff6ff" }}
  >
    <Outlet />
  </div>
);

export default RootLayout;
