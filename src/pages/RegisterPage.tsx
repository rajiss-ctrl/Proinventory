import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { FaEye, FaEyeSlash, FaPeopleArrows, FaRegEnvelope } from "react-icons/fa";
import db, { auth, useAuth } from "../services/firebase";
import AuthInput from "../components/forms/AuthInput";
import Navbar from "../components/layout/Navbar";
import FooterSimple from "../components/layout/FooterSimple";

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  [key: string]: string;
}

const EMPTY: RegisterValues = { name: "", email: "", password: "", confirmPassword: "" };

const RegisterPage = () => {
  const navigate = useNavigate();
  const currentUser = useAuth();
  const [values, setValues] = useState<RegisterValues>(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((p) => ({ ...p, [e.target.name]: e.target.value }));

  const inputs = [
    { id: 1, name: "name", type: "text", placeholder: "Business Name", label: "Name", icon: <FaPeopleArrows />, required: true, errMessages: "Name must be under 20 characters." },
    { id: 2, name: "email", type: "email", placeholder: "Email Address", label: "Email", icon: <FaRegEnvelope />, required: true, errMessages: "Enter a valid email." },
    { id: 3, name: "password", type: showPass ? "text" : "password", placeholder: "Password", label: "Password",
      icon: showPass ? <FaEyeSlash /> : <FaEye />, required: true,
      errMessages: "8–20 characters with letter, number, special char.",
      pattern: "^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$" },
    { id: 4, name: "confirmPassword", type: showPass ? "text" : "password", placeholder: "Confirm Password",
      label: "Confirm", icon: showPass ? <FaEyeSlash /> : <FaEye />, required: true,
      errMessages: "Passwords don't match.", pattern: values.password },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user } = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await addDoc(collection(db, "users"), { uid: user.uid, name: values.name, email: values.email, authProvider: "local" });
      navigate("/dashboard");
    } catch {
      setError("Registration failed. Check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-700 via-indigo-300 to-purple-400 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-10">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg px-6 pt-6 pb-10">
          <h1 className="text-[#46158B] text-xl font-bold text-center mb-6">Create Account</h1>

          <form className="flex flex-col items-center gap-1" onSubmit={handleSubmit}>
            {inputs.map((input) => (
              <AuthInput key={input.id} {...input} value={values[input.name]}
                onChange={onChange} handleShowPassword={() => setShowPass((p) => !p)} />
            ))}
            <button type="submit" disabled={!!currentUser}
              className="w-full h-11 mt-3 shadow-lg rounded-lg bg-[#46158B] hover:bg-[#37096e] text-white text-sm transition">
              SIGN UP
            </button>
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#46148B] underline hover:text-indigo-700">Login</Link>
          </p>
        </div>
      </div>

      <FooterSimple />
    </div>
  );
};

export default RegisterPage;
