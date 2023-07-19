import {Comparable} from "../interface";

export class StringContainer {
  protected readonly str: string;

  constructor(str: string) {
    this.str = str;
  }
}

export class ComparableStringContainer extends StringContainer implements Comparable<ComparableStringContainer> {
  compareTo(cmp: ComparableStringContainer): boolean {
    return this.str === cmp.str;
  }
}