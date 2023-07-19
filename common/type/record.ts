export class Record {
  date: Date;
  recorded: boolean;

  constructor(recorded: boolean, date: Date = new Date()) {
    this.date = date;
    this.recorded = recorded;
  }

  public earlierThan(date: Date): boolean {
    return this.date < date;
  }

  public isRecorded(): boolean {
    return this.recorded;
  }
}