/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEEPSEEK_API_URL?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_DMXAPI_GEMINI_ENDPOINT?: string;
  readonly VITE_DMXAPI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {
  const content: string;
  export default content;
}
