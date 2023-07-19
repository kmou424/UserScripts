import {StringFormatter} from "../lib/formatter";

export default class Checker {
  static isInvalidHref(href: string): boolean {
    return href.startsWith('javascript:') || href.endsWith("/#") || href === '';
  };

  static isInvalidUrl(url: string): boolean {
    // process document url
    const docUrl = new URL(document.URL);
    if (docUrl.hash !== "") docUrl.hash = "";

    // avoid interfering with the evaluation of regular expression
    const docUrlForRegExp = StringFormatter.escapeRegExpChars(docUrl.toString());

    return new RegExp(`${docUrlForRegExp}#.*`).test(url)
  }
}