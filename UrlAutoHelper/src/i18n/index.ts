import Logcat from "../logcat";
import {ValuePath} from "../type";
import {i18n} from './i18n.json';

const i18nSupported = ["zh-CN", "en-US"];

class I18nUnities {
  private readonly language: string;
  private readonly fallback: string = "en-US";

  constructor(language: string) {
    if (!i18nSupported.includes(language)) {
      Logcat.WARN(`Language "${language}" is not supported, fallback to en-US`);
      this.language = this.fallback;
    } else {
      this.language = language;
    }
  }

  public get(path: ValuePath): string {
    // @ts-ignore
    const element = i18n[path.Parse()];
    if (element === undefined) {
      return "unknown path";
    }
    let val = element[this.language];
    if (val === undefined) {
      Logcat.WARN(`"${path.Parse()}" not provide string for language "${this.language}", fallback to "${this.fallback}"`);
      val = element[this.fallback];
    }
    if (val === undefined) {
      return "null";
    }
    return val;
  }
}

const I18n = new I18nUnities(window.navigator.language);

export {
  I18n
};