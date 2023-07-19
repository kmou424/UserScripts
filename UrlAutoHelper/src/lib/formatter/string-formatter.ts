export default class StringFormatter {
  static escapeRegExpChars(url: string): string {
    const specialChars = ['\\', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '^', '$'];
    let escapedUrl = url;
    for (let i = 0; i < specialChars.length; i++) {
      const char = specialChars[i];
      const regex = new RegExp('\\' + char, 'g');
      escapedUrl = escapedUrl.replace(regex, '\\' + char);
    }
    return escapedUrl;
  }
}