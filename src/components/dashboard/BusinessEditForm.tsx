import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import db from "../../services/firebase";

interface BusinessEditFormProps {
  onClose: () => void;
  open: boolean;
}

const BusinessEditForm = ({ onClose, open }: BusinessEditFormProps) => {
  const businessData = useSelector((s: RootState) => s.business.buzProfileData);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const handleUpdate = async (id: string) => {
    try {
      await updateDoc(doc(db, "businesses", id), {
        businessName: name,
        businessAddress: address,
      });
      setName("");
      setAddress("");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div
      className={`z-[4] p-8 text-sm absolute ${
        !open ? "lg:left-72" : "lg:left-32"
      } duration-300 w-[90%] sm:w-[60%] lg:w-[30%] top-[60px] lg:top-[80px] shadow-lg rounded-md bg-white`}
    >
      {businessData.map((item) => (
        <div key={item.id} className="flex flex-col items-center gap-3">
          <img
            src={item.logo}
            alt={item.businessName}
            className="w-8 h-8 rounded-full object-cover"
          />
          <h2 className="text-base font-semibold">Update Business Profile</h2>

          <input
            type="text"
            className="w-full border border-gray-300 rounded-md h-10 text-gray-600 text-sm px-4"
            placeholder={`Edit "${item.businessName}"`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md h-10 text-gray-600 text-sm px-4"
            placeholder="Edit address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex gap-4 w-full">
            <button
              onClick={onClose}
              className="border border-[rgb(255,101,132)] text-[rgb(255,101,132)] rounded px-3 py-1 text-sm"
            >
              Close
            </button>
            <button
              onClick={() => handleUpdate(item.id)}
              className="bg-[#46148B] text-white rounded px-3 py-1 text-sm"
            >
              Save
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessEditForm;
