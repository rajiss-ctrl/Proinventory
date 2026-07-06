import { useState, InputHTMLAttributes } from "react";

interface StockInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errMessages?: string;
}

const StockInputField = ({ label, errMessages, onChange, ...rest }: StockInputFieldProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      <input
        {...rest}
        value={rest.value ?? ""}
        onChange={onChange}
        onBlur={() => setFocused(true)}
        data-focused={String(focused)}
        className="p-3 text-sm w-full border outline-none mb-4 rounded"
      />
      {errMessages && (
        <span className="text-[#fb8a8a] text-xs pb-2 hidden">{errMessages}</span>
      )}
    </div>
  );
};

export default StockInputField;
