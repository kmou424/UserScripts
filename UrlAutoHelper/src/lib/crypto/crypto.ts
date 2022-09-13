import CryptoJS from "crypto-js";

// @ts-ignore
export class Crypto {
  static MD5(input: string): string {
    return CryptoJS.MD5(input).toString().toLowerCase();
  }
}