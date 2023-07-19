export default class Build {
  static getVersion(): string {
    let version = process.env.VERSION_CODE;
    while (version.length < 4) {
      version = '0' + version;
    }
    return version.split('').join('.')
  }

  static getUserScriptUrl(name: string): string {
    return `https://raw.githubusercontent.com/kmou424/TampermonkeyScripts/build/${name}.user.js`
  }
}