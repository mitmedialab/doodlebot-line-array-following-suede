import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ["util"],
      globals: {
        global: true,
      },
    }),
  ],
});
