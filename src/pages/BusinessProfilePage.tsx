import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCloudUploadAlt } from "react-icons/fa";
import db, { useAuth } from "../services/firebase";
import { RootState } from "../app/store";
import DefaultLogo from "../assets/img/stocktrack-logo.png";
import { uploadImageToCloudinary } from "../services/cloudinary.service";

const schema = yup.object({
  businessName: yup.string().required("Business name is required"),
  businessAddress: yup.string().required("Address is required"),
  about: yup.string().required("About field is required"),
  mission: yup.string().required("Mission is required"),
  logo: yup.mixed().required("Logo is required"),
});

interface ProfileFormData {
  businessName: string;
  businessType?: string;
  businessAddress: string;
  about: string;
  mission: string;
  logo: FileList;
}

const BusinessProfilePage = () => {
  const currentUser = useAuth();
  const navigate = useNavigate();
  const businessData = useSelector((s: RootState) => s.business.buzProfileData);
  const [logo, setLogo] = useState(DefaultLogo);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: yupResolver(schema) as any,
  });

  const resizeImage = (src: string, mime: string, cb: (r: string) => void) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const MAX = 150;
      let { width: w, height: h } = img;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      cb(c.toDataURL(mime, 0.7));
    };
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      alert("Only JPG/PNG allowed."); return;
    }
    if (file.size > 1_048_576) { alert("Max 1 MB."); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => resizeImage(ev.target!.result as string, file.type, setLogo);
  };

  const onSubmit = async (data: ProfileFormData) => {
    const docRef = await addDoc(collection(db, "businesses"), {
      user_id: currentUser?.uid,
      businessName: data.businessName,
      businessType: data.businessType ?? "",
      businessAddress: data.businessAddress,
      about: data.about,
      mission: data.mission,
    });

    if (logo !== DefaultLogo) {
      const file = new File([await fetch(logo).then((r) => r.blob())], "business-logo.png", {
        type: "image/png",
      });

      const url = await uploadImageToCloudinary(file, "businesses");
      await updateDoc(doc(db, "businesses", docRef.id), { logo: url });
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 via-blue-100 to-purple-100 flex flex-col items-center">
      <Link to="/dashboard"
        className="absolute flex items-center gap-2 p-1 rounded shadow-sm text-sm bg-white top-4 left-4 text-black hover:underline">
        <FaArrowLeft /> Dashboard
      </Link>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 p-4 pt-14">
        {/* Form */}
        <div className="w-full lg:w-1/2 bg-white shadow-lg p-6 rounded-lg text-gray-800">
          <h2 className="text-lg font-bold mb-4">Create Business Profile</h2>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            {[
              { name: "businessName", placeholder: "Business Name", error: errors.businessName },
              { name: "businessType", placeholder: "Business Type", error: undefined },
              { name: "businessAddress", placeholder: "Business Address", error: errors.businessAddress },
            ].map(({ name, placeholder, error }) => (
              <div key={name}>
                <input type="text" placeholder={placeholder}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  {...register(name as keyof ProfileFormData)} />
                {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
              </div>
            ))}
            {[
              { name: "about", placeholder: "About the business", error: errors.about },
              { name: "mission", placeholder: "Mission statement", error: errors.mission },
            ].map(({ name, placeholder, error }) => (
              <div key={name}>
                <textarea placeholder={placeholder}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  {...register(name as keyof ProfileFormData)} />
                {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
              </div>
            ))}
            <div className="flex items-center gap-4">
              <img src={logo} alt="preview" className="w-16 h-16 rounded-full object-cover shadow" />
              <label className="flex items-center gap-2 cursor-pointer text-indigo-600 text-sm font-medium">
                <FaCloudUploadAlt size={18} /> Upload Logo
                <input accept=".jpg,.jpeg,.png" type="file" className="hidden"
                  {...register("logo")} onChange={handleLogoChange} />
              </label>
            </div>
            <button type="submit"
              className="w-full text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 py-3 rounded-lg hover:opacity-90">
              Save Profile
            </button>
          </form>
        </div>

        {/* Current profile */}
        <div className="w-full lg:w-1/2 bg-white shadow-lg p-6 rounded-lg text-gray-800">
          {businessData.length === 0 ? (
            <p className="text-center text-gray-500">No business profile yet.</p>
          ) : businessData.map((b) => (
            <div key={b.id} className="space-y-3 text-center">
              <img src={b.logo} alt="logo" className="w-16 h-16 mx-auto rounded-full object-cover shadow" />
              <h3 className="text-lg font-bold">{b.businessName}</h3>
              <p className="text-sm">{b.businessAddress}</p>
              <p className="text-sm">{b.about}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfilePage;
