import type {
  Mutation,
  PulledRow,
  PullResponse,
  PushRequest,
  PushResponse,
  Row,
  TableName,
  Transport,
} from "../src";
import { OfflineError, rowSchemas } from "../src";

/**
 * Servidor de mentira com as mesmas regras do Worker: valida cada linha,
 * ignora mutações repetidas, atribui `version` na ordem de chegada e vence a
 * última escrita. Serve para testar o motor sem rede.
 */
export function fakeServer() {
  let version = 0;
  const rows = new Map<string, PulledRow>();
  const applied = new Set<string>();

  const push = ({ mutations }: PushRequest): PushResponse => {
    const accepted: string[] = [];
    const rejected: PushResponse["rejected"] = [];
    for (const m of mutations as Mutation[]) {
      if (applied.has(m.id)) {
        accepted.push(m.id);
        continue;
      }
      const key = `${m.table}:${m.rowId}`;
      if (m.op === "upsert") {
        const parsed = rowSchemas[m.table].safeParse(m.row);
        if (!parsed.success) {
          rejected.push({ id: m.id, reason: "Linha inválida." });
          continue;
        }
        rows.set(key, { table: m.table, row: parsed.data as Row, deleted: false, version: ++version });
      } else {
        const current = rows.get(key);
        if (current) rows.set(key, { ...current, deleted: true, version: ++version });
      }
      applied.add(m.id);
      accepted.push(m.id);
    }
    return { accepted, rejected, version };
  };

  const pull = (since: number, limit = 1000): PullResponse => {
    const changes = [...rows.values()]
      .filter((r) => r.version > since)
      .sort((a, b) => a.version - b.version);
    const page = changes.slice(0, limit);
    const hasMore = changes.length > limit;
    return { changes: page, hasMore, version: hasMore ? page.at(-1)!.version : version };
  };

  return {
    push,
    pull,
    rows,
    get version() {
      return version;
    },
    row(table: TableName, id: string) {
      return rows.get(`${table}:${id}`);
    },
    /** Transporte de um aparelho; `online` liga e desliga a rede dele. */
    transport(options: { online: boolean; pageSize?: number } = { online: true }) {
      const state = { ...options, pushes: 0 };
      const transport: Transport & { state: typeof state } = {
        state,
        async push(request) {
          if (!state.online) throw new OfflineError();
          state.pushes += 1;
          return push(JSON.parse(JSON.stringify(request)));
        },
        async pull(since) {
          if (!state.online) throw new OfflineError();
          return JSON.parse(JSON.stringify(pull(since, state.pageSize)));
        },
      };
      return transport;
    },
  };
}
