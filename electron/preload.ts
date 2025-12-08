import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  requestAccounts: () => {
    console.log('Preload: requestAccounts called')
    return ipcRenderer.invoke('eth_requestAccounts')
  }
}

// Use `contextBridge` to expose Electron APIs to the renderer process.
// Note: The renderer process runs in a sandboxed environment, so
// only the APIs exposed here will be available to it.
if (process.contextIsolated) {
  try {
    console.log('Preload: Exposing APIs via contextBridge')
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    console.log('Preload: APIs exposed successfully')
  } catch (error) {
    console.error('Preload error:', error)
  }
} else {
  console.log('Preload: Exposing APIs directly to window')
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  console.log('Preload: APIs exposed to window')
}