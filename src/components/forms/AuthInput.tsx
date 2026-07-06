import { useState, ReactNode, InputHTMLAttributes } from "react";
import { useAuth } from "../../services/firebase";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  errMessages?: string;
  handleShowPassword?: () => void;
}

const AuthInput = ({
  label, icon, errMessages, handleShowPassword, onChange, ...rest
}: AuthInputProps) => {
  const currentUser = useAuth();
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full relative">
      <input
        {...rest}
        onChange={onChange}
        onBlur={() => setFocused(true)}
        onFocus={() => rest.name === "confirmPassword" && setFocused(true)}
        disabled={!!currentUser}
        data-focused={String(focused)}
        className="border-b outline-none mb-5 rounded w-full text-sm lg:text-base bg-[#eceff1] p-3 shadow"
      />
      {icon && (
        <span
          onClick={handleShowPassword}
          className="absolute text-[#888988] cursor-pointer right-3 top-3"
        >
          {icon}
        </span>
      )}
      {errMessages && (
        <span className="-mt-3 mb-2 text-[#fb8a8a] font-bold text-xs hidden">
          {errMessages}
        </span>
      )}
    </div>
  );
};

export default AuthInput;
