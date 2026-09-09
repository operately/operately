import type { TaskBoard } from "turboui";
import { compareIds } from "@/routes/paths";
import type { KanbanState } from "./parseKanbanState";

export interface KanbanSnapshot {
  board: KanbanState;
  statuses: Map<string, TaskBoard.Status | null>;
}

export interface KanbanMove {
  taskId: string;
  status: TaskBoard.Status;
  index: number;
}

interface PendingMove {
  move: KanbanMove;
  save: (snapshot: KanbanSnapshot) => Promise<unknown>;
  afterSuccess: () => Promise<void>;
  resolve: (success: boolean) => void;
}

/** Keep confirmed state separate from pending moves. Failed moves are removed,
 * then newer intentions are replayed over the confirmed board before saving. */
export class KanbanQueue {
  private pending: PendingMove[] = [];
  private running = false;

  constructor(
    private confirmed: KanbanSnapshot,
    private publish: () => void,
    private onError: (error: unknown) => void,
    private onRefreshError: (error: unknown) => void,
  ) {}

  get isPending() {
    return this.running;
  }

  get snapshot() {
    return this.pending.reduce((snapshot, item) => applyMove(snapshot, item.move), this.confirmed);
  }

  replaceConfirmed(snapshot: KanbanSnapshot) {
    if (!this.running) this.confirmed = snapshot;
  }

  enqueue(move: KanbanMove, save: PendingMove["save"], afterSuccess: PendingMove["afterSuccess"]) {
    return new Promise<boolean>((resolve) => {
      this.pending.push({ move, save, afterSuccess, resolve });
      this.publish();
      void this.drain();
    });
  }

  private async drain() {
    if (this.running) return;

    this.running = true;

    while (this.pending.length) {
      const item = this.pending[0];
      if (!item) break;

      const next = applyMove(this.confirmed, item.move);
      let success = false;

      try {
        const result = await item.save(next);
        if (result && typeof result === "object" && "success" in result && result.success === false) {
          throw new Error("Failed to save task position");
        }
        this.confirmed = next;
        success = true;
      } catch (error) {
        this.onError(error);
      }
      this.pending.shift();
      this.publish();
      if (success) {
        try {
          await item.afterSuccess();
        } catch (error) {
          this.onRefreshError(error);
        }
      }
      item.resolve(success);
    }
    this.running = false;
    this.publish();
  }
}

function applyMove(snapshot: KanbanSnapshot, move: KanbanMove): KanbanSnapshot {
  const board = Object.fromEntries(
    Object.entries(snapshot.board).map(([key, ids]) => [key, ids.filter((id) => !compareIds(id, move.taskId))]),
  );
  const destination = board[move.status.value] ?? [];
  destination.splice(Math.max(0, Math.min(move.index, destination.length)), 0, move.taskId);
  board[move.status.value] = destination;
  const statuses = new Map(snapshot.statuses);
  const taskId = [...statuses.keys()].find((id) => compareIds(id, move.taskId)) ?? move.taskId;
  statuses.set(taskId, move.status);

  return { board, statuses };
}
