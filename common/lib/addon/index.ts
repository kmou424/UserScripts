import Recorder from "../recorder";
import {GM_addElement} from "$";
import {Crypto} from "../crypto";

const AddonElementManager = new class {
  private recorder = new Recorder();

  private doCheckRecord(eleTextContent: string): boolean {
    const eleTextContentHash = Crypto.MD5(eleTextContent);
    const recorded = this.recorder.get(eleTextContentHash);
    if (!recorded) {
      this.recorder.set(eleTextContentHash);
    }
    return recorded;
  }

  public addScript(scriptText: string, onceOnly: boolean = true) {
    if (onceOnly && this.doCheckRecord(scriptText)) return;
    GM_addElement('script', {
      textContent: scriptText
    });
  }
};

export default AddonElementManager;