import * as vscode from 'vscode';

const STORAGE_KEY = 'touchfish.read.ids';

class ReadStateService {
  private set = new Set<string>();
  private initialized = false;

  init(ctx: vscode.ExtensionContext) {
    if (this.initialized) return;
    const raw = ctx.workspaceState.get<string[]>(STORAGE_KEY, []);
    raw.forEach(id => this.set.add(id));
    this.initialized = true;
  }

  isRead(id: string) { return this.set.has(id); }

  markRead(ctx: vscode.ExtensionContext, id: string) {
    if (!this.set.has(id)) {
      this.set.add(id);
      ctx.workspaceState.update(STORAGE_KEY, Array.from(this.set));
    }
  }

  clear(ctx: vscode.ExtensionContext) {
    this.set.clear();
    ctx.workspaceState.update(STORAGE_KEY, []);
  }
}

export const ReadState = new ReadStateService();
