import CryptoJS from "crypto-js";

// @ts-ignore
export class Crypto {
  static MD5(input: string): string {
    return CryptoJS.MD5(input).toString().toLowerCase();
  }
}

export class DOMCrypto {
  private static readonly serializer = new XMLSerializer();

  static MD5(input: Node): string {
    return Crypto.MD5(this.serializer.serializeToString(input));
  }
}