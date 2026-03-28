import { type Readable } from "node:stream";
import {
  type ProcessRequest,
  type ProcessResponse,
  type ReadItem,
} from "./model.ts";
import RateLimiter from "./rate-limiter.ts";
import RecordProcessor from "./record-processor.ts";

type Worker = (item: ProcessRequest) => Promise<ProcessResponse>;

export default class ProcessingPipeline {
  private readonly concurrency: number;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  build(
    source: Readable & AsyncIterable<ReadItem>,
    limiter: RateLimiter,
    processor: RecordProcessor,
  ): Readable {
    function createWorker(
      limiter: RateLimiter,
      processor: RecordProcessor,
    ): Worker {
      return async (item: ProcessRequest): Promise<ProcessResponse> => {
        await limiter.allow();
        return processor.process(item);
      };
    }

    return source.map(createWorker(limiter, processor), {
      concurrency: this.concurrency,
      highWaterMark: this.concurrency,
    });
  }
}
