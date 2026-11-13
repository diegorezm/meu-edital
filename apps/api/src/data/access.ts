import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { type Db, type StudyTableName, studyTables } from "@meu-edital/db";

/**
 * Única porta de acesso aos dados de estudo. Recebe o `userId` da sessão e o
 * aplica em toda consulta; nenhuma rota monta consulta com id vindo do
 * cliente. As escritas do sync também passam por aqui.
 */
export function userData(db: Db, userId: string) {
  return {
    userId,

    /** Linhas alteradas depois de `sinceVersion`, inclusive as excluídas. */
    async changedSince<T extends StudyTableName>(name: T, sinceVersion = 0) {
      const table = studyTables[name];
      return db
        .select()
        .from(table)
        .where(and(eq(table.userId, userId), gt(table.version, sinceVersion)))
        .orderBy(asc(table.version));
    },

    /** Linhas ativas (não excluídas) da tabela. */
    async active<T extends StudyTableName>(name: T) {
      const table = studyTables[name];
      return db
        .select()
        .from(table)
        .where(and(eq(table.userId, userId), isNull(table.deletedAt)));
    },

    async find<T extends StudyTableName>(name: T, id: string) {
      const table = studyTables[name];
      const [row] = await db
        .select()
        .from(table)
        .where(and(eq(table.userId, userId), eq(table.id, id)))
        .limit(1);
      return row;
    },
  };
}

export type UserData = ReturnType<typeof userData>;
