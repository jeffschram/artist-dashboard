/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRELLO_API_KEY: string;
  readonly VITE_TRELLO_TOKEN: string;
  readonly VITE_TRELLO_BOARD_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
