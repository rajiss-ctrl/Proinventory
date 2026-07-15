import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    // Ensure React is only bundled once (prevents version mismatch in monorepos)
    optimizeDeps: {
        include: ["react", "react-dom"],
    },
    build: {
        target: "esnext",
        sourcemap: false,
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes("node_modules"))
                        return undefined;
                    if (id.includes("firebase/auth"))
                        return "firebase-auth";
                    if (id.includes("firebase/firestore"))
                        return "firebase-firestore";
                    if (id.includes("firebase/storage"))
                        return "firebase-storage";
                    if (id.includes("firebase/app"))
                        return "firebase-app";
                    if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
                        return "charts-vendor";
                    }
                    if (id.includes("react-router-dom") || id.includes("react-redux")) {
                        return "app-vendor";
                    }
                    if (id.includes("react-dom")) {
                        return "react-dom-vendor";
                    }
                    if (id.includes("react")) {
                        return "react-vendor";
                    }
                    if (id.includes("react-icons")) {
                        return "icons-vendor";
                    }
                    if (id.includes("browser-image-compression")) {
                        return "image-vendor";
                    }
                    if (id.includes("yup") || id.includes("@hookform")) {
                        return "form-vendor";
                    }
                    return undefined;
                },
            },
        },
    },
    server: {
        port: 5173,
        strictPort: false,
    },
});
