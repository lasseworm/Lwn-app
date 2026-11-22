import { createSerwistRoute } from "@serwist/turbopack";

// Bygger og serverer service workeren (src/app/sw.ts) på /serwist/sw.js
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
