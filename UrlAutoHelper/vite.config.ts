import {defineConfig} from 'vite';
import monkey from 'vite-plugin-monkey';
// @ts-ignore resolveJsonModule
import {name} from './package.json';
import Build from "../common/build";
import {UAH_APP_NAME} from "./src/const";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [monkey({
    entry: 'src/main.ts', userscript: {
      "author": 'kmou424',
      "downloadURL": Build.getUserScriptUrl(name),
      "icon": 'https://vitejs.dev/logo.svg',
      "match": ['*://*/*'],
      "name": UAH_APP_NAME,
      "namespace": 'https://github.com/kmou424/UserScripts',
      "run-at": 'document-end',
      "updateURL": Build.getUserScriptUrl(name),
      "version": `${Build.getVersion()}`
    },
  }),],
});
