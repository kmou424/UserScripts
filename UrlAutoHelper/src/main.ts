// @ts-ignore isolatedModules

import {AUTO_OPEN, BLANK_PATCH} from "./config";
import Logcat from "./logcat";
import {Pattern, PatternMatcher, TYPE_MULTI_WILDCARD} from "./lib/pattern";
import {GM_openInTab} from "$";
import Crypto from "./lib/crypto";
import {KVStorage} from "./lib/storage";
import {ValuePath} from "./type";
import {APP_NAME} from "./const";
import I18nKeys from "./i18n/keys";
import {I18n} from "./i18n";
import Mutex from "./lib/mutex";
import Recorder from "./lib/recorder";

const BlankPatchMutex = new Mutex(false);
const AutoOpenMutex = new Mutex(false);

const BlankPatchRecorder = new Recorder();
const AutoOpenRecorder = new Recorder();

const RunScript = async () => {
  if (new PatternMatcher(new Pattern(TYPE_MULTI_WILDCARD, ...BLANK_PATCH.RUN_ON)).match(document.URL)) {
    BlankPatchMutex.enable();
  }
  if (new PatternMatcher(new Pattern(TYPE_MULTI_WILDCARD, ...AUTO_OPEN.RUN_ON)).match(document.URL)) {
    AutoOpenMutex.enable();
  }
  setInterval(() => {
    if (BlankPatchMutex.enabled() && !BlankPatchMutex.locked()) {
      RunBlankPatch().then(null);
    }
    if (AutoOpenMutex.enabled() && !AutoOpenMutex.locked()) {
      RunAutoOpen().then(null);
    }
  }, 200);

};

const RunBlankPatch = async () => {
  BlankPatchMutex.lock();

  const aTags = document.getElementsByTagName("a");

  // @ts-ignore
  for (const aTag of aTags) {
    // console.log(document.URL + "#")
    if (aTag.href.startsWith('javascript:') || aTag.href.startsWith(document.URL + "/#") || aTag.href === '') {
      continue;
    }
    const url = new URL(aTag.href).toString();
    const hashOfATag = Crypto.MD5(new XMLSerializer().serializeToString(aTag));

    if (BlankPatchRecorder.get(hashOfATag)) {
      continue;
    }

    const isUrlMatched = new PatternMatcher(new Pattern(TYPE_MULTI_WILDCARD, ...BLANK_PATCH.RULES)).match(url);

    if (!isUrlMatched) {
      continue;
    }

    Logcat.INFO(`Patching matched url "${url}"`);

    if (aTag.target === undefined || aTag.target === "") {
      aTag.target = "_blank";
    } else if (!aTag.target.includes("_blank")) {
      aTag.target += " _blank";
    }

    BlankPatchRecorder.set(hashOfATag);
  }

  BlankPatchMutex.unlock();
};

const RunAutoOpen = async () => {
  AutoOpenMutex.lock();

  const aTags = document.getElementsByTagName("a");

  // @ts-ignore
  for (const aTag of aTags) {
    if (aTag.href.startsWith('javascript:') || aTag.href.startsWith(document.URL + "/#") || aTag.href === '') {
      continue;
    }
    const url = new URL(aTag.href).toString();
    const hashOfATag = Crypto.MD5(new XMLSerializer().serializeToString(aTag));

    if (AutoOpenRecorder.get(hashOfATag)) {
      continue;
    }

    const isUrlMatched = new PatternMatcher(new Pattern(TYPE_MULTI_WILDCARD, ...AUTO_OPEN.RULES)).match(url);

    if (isUrlMatched) {
      const urlMD5 = Crypto.MD5(url);
      const valuePath = new ValuePath(APP_NAME, "opened", urlMD5);
      const stored = await KVStorage.getByPath<boolean>(valuePath, false);
      if (stored) {
        aTag.text = `(${I18n.get(I18nKeys.UI_VISITED)}) ${aTag.text}`;
      } else {
        GM_openInTab(url);
        await KVStorage.setByPath<boolean>(valuePath, true);
      }
    }

    AutoOpenRecorder.set(hashOfATag);
  }

  AutoOpenMutex.unlock();
};

await RunScript();
