export interface ElectronAPI {
  getApiKey: () => Promise<string | null>;
  setApiKey: (apiKey: string) => Promise<boolean>;
  deleteApiKey: () => Promise<boolean>;
  onShowApiKeySetup: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
