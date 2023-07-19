import {PatternType, TYPE_MULTI_WILDCARD, TYPE_REGEX, TYPE_WILDCARD} from "./pattern-type";

const ConvertWildcardToRegex = (wildcards: string[]): string => {
  const wildcardsStrings = wildcards.map((wildcard) => {
    if (!wildcard.startsWith("*")) wildcard = "*" + wildcard;
    if (!wildcard.endsWith("*")) wildcard = wildcard + "*";
    wildcard = wildcard.replace(/\*/g, '.*');
    return wildcard;
  });
  return `^(${wildcardsStrings.join('|')})$`;
};

const TestRegExp = (exp: string): boolean => {
  try {
    new RegExp(exp);
    return true;
  } catch (e) {
    return false;
  }
};

export class Pattern {
  private readonly regex: string;
  private readonly type: PatternType;

  constructor(type: PatternType, ...patterns: string[]) {
    if (type.compareTo(TYPE_WILDCARD)) {
      if (patterns.length !== 1) {
        throw new Error('You must provide at least one wildcard');
      }
      this.regex = ConvertWildcardToRegex(patterns);
    } else if (type.compareTo(TYPE_MULTI_WILDCARD)) {
      this.regex = ConvertWildcardToRegex(patterns);
    } else if (type.compareTo(TYPE_REGEX)) {
      if (patterns.length !== 1) {
        throw new Error('You must provide at least one regex');
      }
      this.regex = patterns[0];
    } else {
      throw new Error('PatternType not supported');
    }
    this.type = type;
    if (!TestRegExp(this.regex)) {
      throw new Error(`RegExp "${this.regex}" isn't valid`);
    }
  }

  public getType(): PatternType {
    return this.type;
  }

  public getRegexString(): string {
    return this.regex;
  }
}