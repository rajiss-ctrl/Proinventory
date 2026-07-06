import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../services/firebase";
import Navbar from "../components/layout/Navbar";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email) { alert("Please enter your email."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset link sent — check your inbox.");
      navigate("/login");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-r from-[#F3F5F7] to-[#D1C4E9] flex items-center justify-center overflow-hidden">
      <Navbar />
      <div className="w-4/5 xl:w-2/5 bg-white p-8 rounded-lg shadow-xl flex flex-col items-center gap-4">
        <h1 className="text-[#46148B] text-2xl font-bold">Reset Password</h1>
        <input
          type="email"
          className="border rounded-md p-4 w-full outline-none focus:ring-2 focus:ring-[#46148B] text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
        />
        <button
          onClick={handleReset}
          className="w-full bg-[#46148B] text-white text-sm font-bold py-3 rounded-md hover:bg-[#5C43A5] transition"
        >
          Send Reset Link
        </button>
        <div className="flex justify-between w-full text-sm">
          <Link to="/login" className="text-[#46148B] hover:underline">Back to Login</Link>
          <Link to="/" className="text-[#46148B] hover:underline">Home</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
