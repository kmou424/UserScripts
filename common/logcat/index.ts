export default class Logger {
  private readonly appName: string;
  private LOG = (level: string, ...msg: any[]) => {
    console.log(`[${level}][${new Date().toLocaleString()}] ${this.appName}:`, ...msg);
  };

  constructor(appName: string) {
    this.appName = appName;
  }

  public DEBUG(...msg: any[]) {
    this.LOG("DEBUG", ...msg);
  }

  public INFO(...msg: any[]) {
    this.LOG("INFO", ...msg);
  }

  public WARN(...msg: any[]) {
    this.LOG("WARN", ...msg);
  }

  public ERROR(...msg: any[]) {
    this.LOG("ERROR", ...msg);
  }
}