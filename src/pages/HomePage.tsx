import { useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import HeroSection from "./sections/HeroSection";
import FeatureShowcase from "./sections/FeatureShowcase";
import DevicePreview from "./sections/DevicePreview";
import PricingSection from "./sections/PricingSection";
import FaqSection from "./sections/FaqSection";

const HomePage = () => {
  useEffect(() => {
    document.title = "Proinventory — Smart Inventory Management";
  }, []);

  return (
    <div style={{ background: "var(--color-bg-app)" }}>
      <Navbar />
      <HeroSection />
      <FeatureShowcase />
      {/* <DevicePreview /> */}
      <PricingSection />
      <FaqSection />
      <Footer />
    </div>
  );
};

export default HomePage;
