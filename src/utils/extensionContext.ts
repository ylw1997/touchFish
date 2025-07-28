import { ExtensionContext } from 'vscode';

class ContextManager {
  private static _context: ExtensionContext;

  public static initialize(context: ExtensionContext): void {
    this._context = context;
  }

  public static get context(): ExtensionContext {
    if (!this._context) {
      throw new Error('Extension context has not been initialized.');
    }
    return this._context;
  }
}

export default ContextManager;
