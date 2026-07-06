import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "StockTrack — Page Not Found";
    const timer = setTimeout(() => navigate("/"), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen bg-gradient-to-r from-[#f98a80] to-[#ff8f7d] text-white flex justify-center items-center p-6">
      <div className="text-center max-w-lg px-4 py-6 bg-white/20 rounded-lg shadow-lg backdrop-blur-md">
        <h1 className="text-6xl font-extrabold mb-2">404</h1>
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-lg mb-6 text-white/90">
          The page you're looking for doesn't exist. You'll be redirected home
          in 5 seconds.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-[#213A84] text-white rounded-md hover:bg-[#FF6F61] transition duration-300 shadow-md text-lg font-semibold"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
