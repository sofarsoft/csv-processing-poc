import loadConfig from "./app-config.ts";
import RateLimiter from "./rate-limiter.ts";
import CsvStreamReader from "./csv-reader.ts";
import RecordProcessor from "./record-processor.ts";
import ProcessingPipeline from "./processing-pipeline.ts";
import ConsoleWriter from "./console-writer.ts";

async function main(): Promise<void> {
  const config = loadConfig();
  const reader = new CsvStreamReader(
    config.reader.filePath,
    config.reader.boundedBufferBytes,
  );
  const limiter = new RateLimiter(
    config.limiter.rate,
    config.limiter.intervalMs,
  );
  const processor = new RecordProcessor();
  const writer = new ConsoleWriter();
  const pipeline = new ProcessingPipeline(config.pool.concurrency);

  const stream = pipeline.build(reader.stream, limiter, processor);

  try {
    for await (const response of stream) {
      await writer.write(response);
    }
  } finally {
    limiter.dispose();
  }
}

await main();
