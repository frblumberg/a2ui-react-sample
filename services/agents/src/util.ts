import type {A2uiMessage} from '@sample/shared';
import type {AgentContext, AgentEvent} from './types';
import type {ToolName, Tools} from './mcp/tools';

export const say = (agent: string, text: string): AgentEvent => ({kind: 'text', text, agent});
export const ui = (message: A2uiMessage): AgentEvent => ({kind: 'a2ui', message});
export const trace = (step: string): AgentEvent => ({kind: 'trace', step});

/**
 * Tool-Aufruf mit Trace-Event. In Produktion ist das ein MCP-`tools/call`.
 * Nutzung: `const customer = yield* callTool(ctx, 'crm.getCustomer', {...})`
 */
export async function* callTool<N extends ToolName>(
  ctx: AgentContext,
  name: N,
  args: Parameters<Tools[N]>[0],
): AsyncGenerator<AgentEvent, Awaited<ReturnType<Tools[N]>>> {
  yield trace(`MCP → ${name}`);
  const fn = ctx.tools[name] as (a: typeof args) => ReturnType<Tools[N]>;
  return await fn(args);
}

/** "12.480", "12 480" oder "12480" → 12480; sonst null. */
export function parseReading(input: string): number | null {
  const cleaned = input.replace(/[.\s]/g, '');
  const m = cleaned.match(/\d{1,7}/);
  return m && /^\D*\d{1,7}\D*$/.test(cleaned) ? Number(m[0]) : null;
}
