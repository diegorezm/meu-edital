import { Hono } from "hono";
import { createDb } from "@meu-edital/db";
import { exportJson, sessionsCsv, today } from "@meu-edital/domain";
import { loadAppData } from "../data/proposals";
import type { AppContext } from "../env";
import { rateLimit } from "./rateLimit";
import { requireUser } from "./session";

/** Marca de ordem de bytes: faz o Excel abrir o CSV em UTF-8. */
const BOM = String.fromCharCode(0xfeff);

/** Exportação dos dados do estudante: tudo em JSON ou as sessões em CSV. */
export const exportRoutes = new Hono<AppContext>()
  .use(requireUser, rateLimit("API_LIMITER", (c) => c.get("userId")))
  .get("/", async (c) => {
    const format = c.req.query("formato") === "csv" ? "csv" : "json";
    const data = await loadAppData(createDb(c.env.DB), c.get("userId"));
    const name = `meu-edital-${today()}`;
    if (format === "csv")
      return c.body(BOM + sessionsCsv(data), 200, {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${name}-sessoes.csv"`,
      });
    return c.body(JSON.stringify(exportJson(data), null, 2), 200, {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${name}.json"`,
    });
  });
