/**
 * Mock-Tools. In der Beispiel-Architektur sind das MCP-Server vor CRM,
 * Contentful und Abrechnung. Die Signaturen sind so gewählt, dass man sie
 * 1:1 gegen echte MCP-Tool-Calls tauschen kann.
 */

export interface Meter {
  id: string;
  medium: 'Strom' | 'Gas';
  unit: string;
  lastReading: number;
  lastReadingDate: string; // ISO
}

export interface Customer {
  firstName: string;
  contractId: string;
  postalCode: string;
  meters: Meter[];
}

export interface Tariff {
  id: string;
  name: string;
  pricePerMonth: number;
  workPriceCt: number;
  note: string;
}

export interface Tools {
  'crm.getCustomer'(args: {sessionId: string}): Promise<Customer>;
  'billing.submitMeterReading'(args: {meterId: string; value: number}): Promise<{receiptId: string; consumption: number}>;
  'content.listTariffs'(args: {postalCode: string}): Promise<Tariff[]>;
  'contracts.requestTariffChange'(args: {contractId: string; tariffId: string}): Promise<{caseId: string; effectiveFrom: string}>;
}

export type ToolName = keyof Tools;

export function createMockTools(): Tools {
  const readings = new Map<string, {value: number; date: string}>();
  const today = () => new Date().toISOString().slice(0, 10);
  return {
    async 'crm.getCustomer'() {
      return {
        firstName: 'Alex',
        contractId: 'V-2026-0815',
        postalCode: '76131',
        meters: [
          {
            id: '1EBZ0100123456',
            medium: 'Strom',
            unit: 'kWh',
            lastReading: readings.get('1EBZ0100123456')?.value ?? 12345,
            lastReadingDate: readings.get('1EBZ0100123456')?.date ?? '2026-05-02',
          },
        ],
      };
    },
    async 'billing.submitMeterReading'({meterId, value}) {
      const before = readings.get(meterId)?.value ?? 12345;
      readings.set(meterId, {value, date: today()});
      return {receiptId: `ZS-${Date.now().toString(36).toUpperCase()}`, consumption: value - before};
    },
    async 'content.listTariffs'() {
      return [
        {id: 'oeko-flex', name: 'Ökostrom Flex', pricePerMonth: 89.5, workPriceCt: 31.9, note: 'Monatlich kündbar'},
        {id: 'oeko-fix24', name: 'Ökostrom Fix 24', pricePerMonth: 84.2, workPriceCt: 29.4, note: 'Preisgarantie 24 Monate'},
        {id: 'dynamisch', name: 'Strom Dynamisch', pricePerMonth: 79.0, workPriceCt: 27.1, note: 'Stündlicher Börsenpreis, Smart Meter nötig'},
      ];
    },
    async 'contracts.requestTariffChange'() {
      return {caseId: `TW-${Date.now().toString(36).toUpperCase()}`, effectiveFrom: '2026-12-01'};
    },
  };
}
