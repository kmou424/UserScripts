import {APP_NAME} from "../../UrlAutoHelper/src/const";

const LOG = (level: string, ...msg: any[]) => {
  console.log(`[${level}][${new Date().toLocaleString()}] ${APP_NAME}:`, ...msg);
};

export default class Logcat {
  public static DEBUG(...msg: any[]) {
    LOG("DEBUG", ...msg);
  }

  public static INFO(...msg: any[]) {
    LOG("INFO", ...msg);
  }

  public static WARN(...msg: any[]) {
    LOG("WARN", ...msg);
  }

  public static ERROR(...msg: any[]) {
    LOG("ERROR", ...msg);
  }
}