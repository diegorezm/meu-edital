import { DurableObject } from "cloudflare:workers";
import type { SyncNotice } from "@meu-edital/sync";
import { sendPush } from "../push/send";

type BlockEnd = { userId: string; endsAt: number; subject: string };

/**
 * Um por usuário. Guarda os WebSockets dos aparelhos dele (com hibernação,
 * sem custo parado) e avisa todos quando a versão muda. Também guarda o
 * alarme do fim de bloco, para avisar por Web Push com a aba fechada. Só leva avisos: os
 * dados vêm sempre pelo pull, então perder a conexão não perde nada.
 */
export class UserHub extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket")
      return new Response("Esperava um WebSocket.", { status: 426 });
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Avisa os aparelhos conectados que há versão nova para puxar. */
  async notify(version: number): Promise<number> {
    const notice: SyncNotice = { type: "version", version };
    const sockets = this.ctx.getWebSockets();
    for (const socket of sockets) {
      try {
        socket.send(JSON.stringify(notice));
      } catch {
        // Conexão já fechada; o aparelho faz pull ao reconectar.
      }
    }
    return sockets.length;
  }

  /** Agenda (ou remarca) o aviso de fim de bloco. */
  async scheduleBlockEnd(userId: string, endsAt: number, subject: string): Promise<void> {
    await this.ctx.storage.put<BlockEnd>("blockEnd", { userId, endsAt, subject });
    await this.ctx.storage.setAlarm(endsAt);
  }

  async cancelBlockEnd(): Promise<void> {
    await this.ctx.storage.delete("blockEnd");
    await this.ctx.storage.deleteAlarm();
  }

  async alarm(): Promise<void> {
    const block = await this.ctx.storage.get<BlockEnd>("blockEnd");
    await this.ctx.storage.delete("blockEnd");
    if (!block) return;
    await sendPush(this.env, block.userId, {
      title: "Bloco concluído",
      body: `O tempo de ${block.subject} acabou. Registre o estudo quando quiser.`,
      url: "/estudar",
      tag: "fim-de-bloco",
    });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    if (message === "ping") socket.send("pong");
  }

  async webSocketClose(socket: WebSocket, code: number, reason: string) {
    // 1005 e 1006 são reservados: não podem ser enviados de volta.
    const valid = code === 1000 || (code >= 3000 && code < 5000);
    try {
      socket.close(valid ? code : 1000, valid ? reason : "");
    } catch {
      // Já fechado.
    }
  }
}
