import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { FaAt, FaEye, FaEyeSlash } from "react-icons/fa";
import { auth } from "../services/firebase";
import { setCurrentUser } from "../features/auth/authSlice";
import Navbar from "../components/layout/Navbar";
import FooterSimple from "../components/layout/FooterSimple";

interface LoginFormData {
  email: string;
  password: string;
}

const schema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().min(8, "Min 8 characters").max(20).required("Password is required"),
});

const GUEST = { email: "stocktrack.guest@gmail.com", pass: "stocktrack02!" };

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const loginAndRedirect = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    dispatch(setCurrentUser({ uid: user.uid, email: user.email ?? "" }));
    sessionStorage.setItem("currentUser", JSON.stringify({ uid: user.uid, email: user.email }));
    navigate("/dashboard");
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true); setServerErr("");
    try { await loginAndRedirect(data.email, data.password); }
    catch { setServerErr("Wrong credentials or network issue."); }
    finally { setLoading(false); }
  };

  const handleGuestLogin = async () => {
    setLoading(true); setServerErr("");
    try { await loginAndRedirect(GUEST.email, GUEST.pass); }
    catch { setServerErr("Guest login failed. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-700 via-indigo-300 to-purple-400 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-10">
        {/* Floating guest button */}
        <button onClick={handleGuestLogin} disabled={loading}
          className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-lg animate-bounce hover:scale-105 transition-transform md:hidden">
          Try the Dashboard!
        </button>

        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-xl font-bold text-[#46158B] mb-6">Sign In</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
            {/* Email */}
            <div className="flex items-center shadow py-3 px-3 rounded bg-[#eceff1]">
              <input {...register("email")} type="email" placeholder="Email"
                className="outline-none bg-transparent w-full text-sm" />
              <FaAt className="text-gray-400" />
            </div>
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}

            {/* Password */}
            <div className="flex items-center shadow py-3 px-3 rounded bg-[#eceff1]">
              <input {...register("password")} type={showPass ? "text" : "password"} placeholder="Password"
                className="outline-none bg-transparent w-full text-sm" />
              <button type="button" onClick={() => setShowPass((p) => !p)} className="text-gray-400">
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-lg bg-[#46148B] text-white font-semibold mt-2 hover:opacity-90 disabled:opacity-60">
              {loading ? "Signing in…" : "SIGN IN"}
            </button>
          </form>

          {serverErr && <p className="text-red-500 text-sm mt-3">{serverErr}</p>}

          <div className="flex justify-between mt-5 text-sm text-gray-500">
            <Link to="/reset" className="underline hover:text-indigo-700">Forgot password?</Link>
            <Link to="/register" className="underline hover:text-indigo-700">Create account</Link>
          </div>

          {/* Desktop guest */}
          <button onClick={handleGuestLogin} disabled={loading}
            className="hidden md:block w-full mt-4 py-2 border border-[#46148B] text-[#46148B] text-sm rounded hover:bg-indigo-50">
            {loading ? "Signing in…" : "Continue as Guest"}
          </button>
        </div>
      </div>

      <FooterSimple />
    </div>
  );
};

export default LoginPage;
