export interface IElectronAPI {
  requestAccounts: () => Promise<string[]>
}

declare global {
  interface Window {
    api: IElectronAPI
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      send: (method: string, params?: any[]) => Promise<any>
    }
  }
  
  interface ImportMetaEnv {
    readonly VITE_INFURA_PROJECT_ID: string
    readonly VITE_INFURA_PROJECT_SECRET: string
    readonly VITE_PINATA_API_KEY: string
    readonly VITE_PINATA_SECRET_KEY: string
    readonly VITE_WEB3STORAGE_TOKEN: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}