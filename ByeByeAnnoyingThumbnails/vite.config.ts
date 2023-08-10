import {defineConfig} from 'vite';
import monkey from 'vite-plugin-monkey';
// @ts-ignore
import {name} from './package.json';
import Build from "../common/build";
import {BBAT_APP_NAME} from "./src/const";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        "author": 'kmou424',
        "downloadURL": Build.getUserScriptUrl(name),
        "icon": 'https://vitejs.dev/logo.svg',
        "match": ['*://*/*'],
        "name": BBAT_APP_NAME,
        // @ts-ignore
        "name:zh-CN": '屏蔽烦人的图片视频',
        "namespace": 'https://github.com/kmou424/UserScripts',
        "run-at": 'document-start',
        "updateURL": Build.getUserScriptUrl(name),
        "version": `${Build.getVersion()}`
      },
    }),
  ],
});
