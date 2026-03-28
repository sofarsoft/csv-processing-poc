import { type ProcessRequest, type ProcessResponse } from "./model.ts";

export default class RecordProcessor {
  private async externalApiCall(): Promise<object> {
    await setTimeout(() => {}, 100);
    return {
      observations: ["observation1", "observation2", "observation3"],
    };
  }

  async process(record: ProcessRequest): Promise<ProcessResponse> {
    const response = await this.externalApiCall();
    return {
      ...record,
      ...response,
      processedAt: new Date().toISOString(),
    };
  }
}
