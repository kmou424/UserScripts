import {Pattern} from "./pattern";

export class PatternMatcher {
  private readonly pattern: string;

  constructor(pattern: Pattern) {
    this.pattern = pattern.getRegexString();
  }

  public match(toMatch: string): boolean {
    const regexMatcher = new RegExp(this.pattern);
    return regexMatcher.test(toMatch);
  }
}