import { generateSettlementInvoiceBlob, generateSettlementInvoicesBatchBlob } from '../utils/pdf';

self.onmessage = async (event: MessageEvent) => {
  const { type, payload, id } = event.data as {
    type?: 'SINGLE' | 'BATCH';
    payload?: Record<string, unknown>;
    id?: string | number;
  };

  try {
    let result: unknown;
    if (type === 'SINGLE') {
      result = await generateSettlementInvoiceBlob(
        (payload?.settlement as Parameters<typeof generateSettlementInvoiceBlob>[0]) ?? null,
        (payload?.merchant as Parameters<typeof generateSettlementInvoiceBlob>[1]) ?? null,
      );
    } else if (type === 'BATCH') {
      result = await generateSettlementInvoicesBatchBlob(
        (payload?.settlements as Parameters<typeof generateSettlementInvoicesBatchBlob>[0]) ?? [],
        (payload?.merchant as Parameters<typeof generateSettlementInvoicesBatchBlob>[1]) ?? null,
      );
    }
    self.postMessage({ id, success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown worker error';
    self.postMessage({ id, success: false, error: message });
  }
};
