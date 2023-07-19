export default class Recorder {
  private map = new Map<any, boolean>();

  public get(val: any): boolean {
    return this.map.has(val);
  }

  public set(val: any) {
    this.map.set(val, true);
  }
}