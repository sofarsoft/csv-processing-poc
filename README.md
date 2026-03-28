# CSV processing PoC

## 1. Overview

This TypeScript PoC streams CSV rows from disk, enriches each row with data from
a simulated external API call and prints each enriched record to stdout as the
PoC output. The PoC implements streaming with bounded buffering, limited
concurrency, and a simple custom rate limiter. It is meant to be runnable
locally with `npm` and in a Docker image with a minimal `Dockerfile`.

## 2. Architecture / flow

1. **`src/app-config.ts`** — Loads env-based settings (CSV path, row/buffer
   sizing, pool size, rate limit).
2. **`src/csv-reader.ts`** — `fs.createReadStream` with a bounded
   `highWaterMark` (`ROW_SIZE_BYTES` × `BUFFER_ROWS`), piped into `fast-csv`
   with `headers: true`.
3. **`src/processing-pipeline.ts`** — Applies the enrichment stage over the
   parsed CSV stream using Node’s `Readable.prototype.map` (see `concurrency` /
   `highWaterMark` options). Each mapped chunk awaits the limiter, then calls
   the processor.
4. **`src/rate-limiter.ts`** — In-memory rate limiter (see below); `main`
   disposes its timer on exit.
5. **`src/record-processor.ts`** — Simulates work (`setTimeout` ~100 ms) and
   merges stub fields plus `processedAt` into each row.
6. **`src/main.ts`** — Wires the pieces and `for await`’s pipeline output into
   the writer.
7. **`src/console-writer.ts`** — Writes each record with `console.log` (stdout).

**`src/model.ts`** — Data objects shapes (`ReadItem`, `ProcessRequest`,
`ProcessResponse`, `WriteItem`).

## 3. Concurrency and rate limiting

- **Concurrency** — `POOL_CONCURRENCY` is passed to `Readable.prototype.map` as
  the concurrency cap for in-flight async row handlers.
- **Rate limiting** — Before each `processor.process`, `limiter.allow()` runs.
  The limiter keeps a permit counter; when the counter is zero, callers wait in
  a FIFO queue. A `setInterval` every `API_RATE_INTERVAL_MS` resets available
  permits to `API_RATE_LIMIT` and wakes waiters. That is a simple fixed-window,
  in-process rate limiter / scheduler.

## 4. How to run locally

```bash
npm install
npm start
```

Optional environment variables:

- `CSV_FILE_PATH` — default `sample/small-sample.csv` (relative to project root
  or absolute)
- `POOL_CONCURRENCY` — default `5`
- `API_RATE_LIMIT` — default `50` (permits refilled each interval)
- `API_RATE_INTERVAL_MS` — default `1000`
- `ROW_SIZE_BYTES` — default `10240` (used with `BUFFER_ROWS` to size the read
  stream buffer)
- `BUFFER_ROWS` — default `50` (`highWaterMark` = `ROW_SIZE_BYTES` ×
  `BUFFER_ROWS`)

Optional: `npm run typecheck`.

## 5. How to run with Docker

```bash
docker build -t csv-processing-poc .
docker run --rm csv-processing-poc
```

The image sets `CSV_FILE_PATH=sample/large-sample.csv` by default (see
`Dockerfile`). Override as needed:

```bash
docker run --rm -e POOL_CONCURRENCY=3 -e API_RATE_LIMIT=10 csv-processing-poc
docker run --rm -e CSV_FILE_PATH=sample/small-sample.csv csv-processing-poc
```

## 6. Current limitations / next improvements

- Output is stdout only; no file sink or structured logging.
- Rate limiter is single-process memory; resets are fixed-window, not a
  distributed or leaky-bucket implementation.
- `RecordProcessor` is a stub; errors, retries, and timeouts are not modeled.
- Read buffer sizing is approximated through `ROW_SIZE_BYTES` rather than
  derived dynamically from actual CSV row sizes.

## 7. Why TypeScript

- Good support for streaming input
- A simple async model for concurrent orchestration
- Fast implementation for a readable PoC
- Easy local and containerized execution
