import { defineConfig } from "vite";
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { resolve } from "path";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    dts({
      outDir: "dist",
      tsconfigPath: "./tsconfig.app.json",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "react-use-echarts",
      formats: ["es", "umd"],
      fileName: (format) => `index.${format}.js`,
    },
    rolldownOptions: {
      external: ["react", "react-dom", "echarts"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          echarts: "echarts",
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
