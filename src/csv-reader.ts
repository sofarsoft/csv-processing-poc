import fs from "fs";
import { parse, type CsvParserStream } from "fast-csv";
import { type ReadItem } from "./model.ts";

export default class CsvStreamReader {
  readonly stream: CsvParserStream<ReadItem, ReadItem>;

  constructor(filePath: string, boundedBufferSize: number) {
    const source = fs.createReadStream(filePath, {
      highWaterMark: boundedBufferSize,
    });

    this.stream = source.pipe(parse<ReadItem, ReadItem>({ headers: true }));
  }
}
