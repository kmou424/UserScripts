import {ComparableStringContainer} from "../../type";

export type PatternType = ComparableStringContainer

export const TYPE_WILDCARD: PatternType = new ComparableStringContainer("wildcard");

export const TYPE_MULTI_WILDCARD: PatternType = new ComparableStringContainer("multi_wildcard");

export const TYPE_REGEX: PatternType = new ComparableStringContainer("pattern");
