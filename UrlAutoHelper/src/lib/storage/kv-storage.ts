import {GM_getValue, GM_setValue} from "$";
import {ValuePath} from "../../type";

export class KVStorage {
  public static async get<T>(key: string, def: T): Promise<T> {
    return GM_getValue(key, def);
  }

  public static async getByPath<T>(path: ValuePath, def: T): Promise<T> {
    return this.get(path.Parse(), def);
  }

  public static async set<T>(key: string, value: T) {
    await GM_setValue(key, value);
  }

  public static async setByPath<T>(path: ValuePath, value: T) {
    await this.set(path.Parse(), value);
  }
}