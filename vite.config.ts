import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "./" makes the build work both at a domain root and under
// GitHub Pages' /repository-name/ path.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
