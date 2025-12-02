export interface VersionInfo {
  version: string;
  download_url: string;
  message: string;
  force_update: boolean;
}

export interface ElectronAPI {
  getApiKey: () => Promise<string | null>;
  setApiKey: (apiKey: string) => Promise<boolean>;
  deleteApiKey: () => Promise<boolean>;
  onShowApiKeySetup: (callback: () => void) => void;
  checkVersion: () => Promise<VersionInfo | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
