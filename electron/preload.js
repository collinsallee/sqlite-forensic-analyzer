const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  saveFile: (fileData, fileId) => ipcRenderer.invoke('save-file', fileData, fileId),
  readFile: (fileId, offset, length) => ipcRenderer.invoke('read-file', fileId, offset, length),
  editFile: (fileId, offset, hexValue) => ipcRenderer.invoke('edit-file', fileId, offset, hexValue),
  getFileInfo: (fileId) => ipcRenderer.invoke('get-file-info', fileId),
  calculateFileHash: (fileId) => ipcRenderer.invoke('calculate-file-hash', fileId)
}); 