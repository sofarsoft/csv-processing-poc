import path from "node:path";
import { fileURLToPath } from "node:url";

export type AppConfig = {
  reader: {
    filePath: string;
    rowSizeBytes: number;
    boundedBufferBytes: number;
  };
  limiter: {
    rate: number;
    intervalMs: number;
  };
  pool: {
    concurrency: number;
  };
};

function readPositiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be an integer >= 1`);
  }

  return value;
}

function resolveProjectPath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const srcDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(srcDir, "..");
  return path.resolve(projectRoot, filePath);
}

export default function loadConfig(): AppConfig {
  const filePath = resolveProjectPath(
    process.env.CSV_FILE_PATH ?? "sample/small-sample.csv",
  );
  const rowSizeBytes = readPositiveInteger("ROW_SIZE_BYTES", 10 * 1024);
  const bufferRows = readPositiveInteger("BUFFER_ROWS", 50);

  return {
    reader: {
      filePath,
      rowSizeBytes,
      boundedBufferBytes: rowSizeBytes * bufferRows,
    },
    limiter: {
      rate: readPositiveInteger("API_RATE_LIMIT", 50),
      intervalMs: readPositiveInteger("API_RATE_INTERVAL_MS", 1000),
    },
    pool: {
      concurrency: readPositiveInteger("POOL_CONCURRENCY", 5),
    },
  };
}
