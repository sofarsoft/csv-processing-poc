import { type WriteItem } from "./model.ts";

export default class ConsoleWriter {
  write(item: WriteItem): void {
    console.log(item);
  }
}
