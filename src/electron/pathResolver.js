import path from 'path';
import { app } from 'electron';
import { isDev } from './utils.js';

export function getPreloadPath() {
  return isDev()
    ? path.join(app.getAppPath(), 'src/electron/preload.cjs') // Dev mode
    : path.join(app.getAppPath(), 'dist-electron/preload.cjs'); // Production
}

export function getUIPath() {
  return path.join(app.getAppPath(), '/dist-react/index.html');
}

export function getAssetPath() {
  return path.join(app.getAppPath(), isDev() ? '.' : '..', '/src/assets');
}