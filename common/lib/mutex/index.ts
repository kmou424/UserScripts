export default class Mutex {
  private isLocked: boolean;
  private isEnabled: boolean;

  constructor(enabled: boolean = true) {
    this.isLocked = false;
    this.isEnabled = enabled;
  }

  public lock(): boolean {
    if (this.isLocked) {
      return false;
    }
    this.isLocked = true;
    return true;
  }

  public unlock() {
    this.isLocked = false;
  }

  public locked() {
    return this.isLocked;
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public enabled(): boolean {
    return this.isEnabled;
  }
}