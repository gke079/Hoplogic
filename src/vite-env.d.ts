/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DERIV_APP_ID?: string;
  readonly VITE_DERIV_APP_NAME?: string;
  readonly VITE_DERIV_ENV?: string;
  readonly VITE_DERIV_OAUTH_SCOPES?: string;
  readonly VITE_DERIV_REFERRAL_LINK?: string;
  readonly VITE_GD_CLIENT_ID?: string;
  readonly VITE_GD_APP_ID?: string;
  readonly VITE_GD_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
