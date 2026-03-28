export default class RateLimiter {
  private available: number;
  private readonly pending: Array<() => void> = [];
  private readonly timer: NodeJS.Timeout;
  private readonly rate: number;
  private readonly interval: number;

  constructor(rate: number, interval: number) {
    this.rate = rate;
    this.interval = interval;
    this.available = rate;
    this.timer = setInterval(() => {
      this.available = this.rate;
      this.releasePending();
    }, this.interval);
  }

  async allow(): Promise<void> {
    if (this.available > 0) {
      this.available -= 1;
      return;
    }

    return new Promise((resolve) => {
      this.pending.push(() => {
        this.available -= 1;
        resolve();
      });
    });
  }

  private releasePending(): void {
    while (this.available > 0 && this.pending.length > 0) {
      const next = this.pending.shift();
      if (!next) {
        return;
      }

      next();
    }
  }

  dispose(): void {
    clearInterval(this.timer);
  }
}
