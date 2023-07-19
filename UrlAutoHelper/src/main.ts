// @ts-ignore isolatedModules

import {AUTO_OPEN, BLANK_PATCH} from "./config";
import Logcat from "../../common/logcat";
import {Pattern, PatternMatcher, TYPE_MULTI_WILDCARD} from "../../common/lib/pattern";
import {GM_addElement, GM_openInTab} from "$";
import {Crypto, DOMCrypto} from "../../common/lib/crypto";
import {KVStorage} from "../../common/lib/storage";
import {ValuePath} from "../../common/type";
import {APP_NAME} from "./const";
import I18nKeys from "./i18n/keys";
import {I18n} from "./i18n";
import Mutex from "../../common/lib/mutex";
import Recorder from "../../common/lib/recorder";
import Templates from "./templates";
import Checker from "./checker";

const BlankPatchMutex = new Mutex(false);
const AutoOpenMutex = new Mutex(false);

const BlankPatchRecorder = new Recorder();
const AutoOpenRecorder = new Recorder();

const RunScript = async () => {
  const WindowUrlMatcher = (wildcards: string[]): boolean => {
    return new PatternMatcher(new Pattern(TYPE_MULTI_WILDCARD, ...wildcards)).match(document.URL);
  };

  const CheckModules = () => {
    (BLANK_PATCH.EXCLUDES.length > 0 ? !WindowUrlMatcher(BLANK_PATCH.EXCLUDES) : false) &&
    (BLANK_PATCH.INCLUDES.length > 0 ? WindowUrlMatcher(BLANK_PATCH.INCLUDES) : false) ? (() => {
      BlankPatchMutex.enable();
    })() : null;

    (AUTO_OPEN.EXCLUDES.length > 0 ? !WindowUrlMatcher(AUTO_OPEN.EXCLUDES) : false) &&
    (AUTO_OPEN.INCLUDES.length > 0 ? WindowUrlMatcher(AUTO_OPEN.INCLUDES) : false) ? (() => {
      AutoOpenMutex.enable();
    })() : null;
  };

  const RunModules = () => {
    if (BlankPatchMutex.enabled() && !BlankPatchMutex.locked()) {
      RunBlankPatch().then(null);
    }
    if (AutoOpenMutex.enabled() && !AutoOpenMutex.locked()) {
      RunAutoOpen().then(null);
    }
  };

  CheckModules();
  RunModules();
  setInterval(() => {
    RunModules();
  }, 500);
};

const RunBlankPatch = async () => {
  BlankPatchMutex.lock();

  const aTags = document.getElementsByTagName("a");

  // @ts-ignore
  for (const aTag of aTags) {
    // check href
    if (Checker.isInvalidHref(aTag.href)) continue;

    const url = new URL(aTag.href).toString();
    // check url
    if (Checker.isInvalidUrl(url)) continue;

    const hashOfATag = DOMCrypto.MD5(aTag);

    if (BlankPatchRecorder.get(hashOfATag)) {
      continue;
    }

    const isUrlMatched = new PatternMatcher(new Pattern(TYPE_MULTI_WILDCARD, ...BLANK_PATCH.RULES)).match(url);

    if (!isUrlMatched) {
      continue;
    }

    Logcat.INFO(`Patching matched url "${url}"`);

    GM_addElement("script", {
      textContent: Templates.SCRIPT_OPEN_HYPERLINK
    });

    aTag.setAttribute("onclick", `CustomOpenNewHyperlink(event, "${url}", true)`);

    BlankPatchRecorder.set(hashOfATag);
  }

  BlankPatchMutex.unlock();
};

const RunAutoOpen = async () => {
  AutoOpenMutex.lock();

  const aTags = document.getElementsByTagName("a");

  // @ts-ignore
  for (const aTag of aTags) {
    // check href
    if (Checker.isInvalidHref(aTag.href)) continue;

    const url = new URL(aTag.href).toString();
    let hashOfATag = DOMCrypto.MD5(aTag);

    if (AutoOpenRecorder.get(hashOfATag)) {
      continue;
    }

    const isUrlMatched = new PatternMatcher(new Pattern(TYPE_MULTI_WILDCARD, ...AUTO_OPEN.RULES)).match(url);

    if (isUrlMatched) {
      const urlMD5 = Crypto.MD5(url);
      const valuePath = new ValuePath(APP_NAME, "opened", urlMD5);
      const stored = await KVStorage.getByPath<boolean>(valuePath, false);
      if (stored) {
        aTag.text = `${I18n.get(I18nKeys.UI_VISITED)} ${aTag.text}`;
        // update hash because innerText has been changed
        hashOfATag = DOMCrypto.MD5(aTag);
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
