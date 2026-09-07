const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  dragStart: (sx, sy) => ipcRenderer.send('pet-drag-start', sx, sy),
  dragMove: (sx, sy) => ipcRenderer.send('pet-drag-move', sx, sy),
  dragEnd: () => ipcRenderer.send('pet-drag-end'),
  bounce: () => ipcRenderer.send('pet-bounce'),
  openMenu: () => ipcRenderer.send('pet-context'),
  sendSpec: (spec) => ipcRenderer.send('pet-spec', spec),
  sendIcon: (dataUrl) => ipcRenderer.send('pet-icon', dataUrl),
  sendSnapshot: (dataUrl) => ipcRenderer.send('pet-snapshot', dataUrl),
  onCommand: (cb) => ipcRenderer.on('pet-command', (_e, payload) => cb(payload))
});
