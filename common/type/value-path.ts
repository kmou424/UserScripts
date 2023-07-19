export class ValuePath {

  private readonly path: string[];

  constructor(...path: string[]) {
    this.path = path;
  }

  public Parse(): string {
    return this.path.join(".");
  }
}