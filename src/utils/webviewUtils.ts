import * as vscode from "vscode";
import * as fs from "fs";

interface WebviewHtmlOptions {
  webviewView: vscode.WebviewView;
  context: vscode.ExtensionContext;
  distPath: string; // Relative path to dist folder, e.g., "weibo/dist"
  devPort: number; // Vite dev server port
  title?: string; // Webview title
  windowConfig?: Record<string, any>; // Global variables to inject into window
}

export function getWebviewHtml(options: WebviewHtmlOptions): string {
  const {
    webviewView,
    context,
    distPath,
    devPort,
    title = "React App",
    windowConfig = {},
  } = options;
  const isDev = context.extensionMode === vscode.ExtensionMode.Development;

  // Generate window config script
  const configScript = Object.entries(windowConfig)
    .map(([key, value]) => `window.${key} = ${JSON.stringify(value)};`)
    .join("\n");

  if (isDev) {
    // Development mode: Load from Vite dev server
    return `
      <!doctype html>
      <html lang="en">
        <head>
          <script>
            ${configScript}
          </script>
          <script type="module">
            import RefreshRuntime from "http://localhost:${devPort}/@react-refresh"
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
          </script>
          <script type="module" src="http://localhost:${devPort}/@vite/client"></script>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="http://localhost:${devPort}/vite.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${title}</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="http://localhost:${devPort}/src/main.tsx"></script>
        </body>
      </html>
    `;
  } else {
    // Production mode: Load from local dist files
    const distUri = vscode.Uri.joinPath(
      context.extensionUri,
      ...distPath.split("/")
    );
    const indexUri = vscode.Uri.joinPath(distUri, "index.html");

    let html = "";
    try {
      html = fs.readFileSync(indexUri.fsPath, "utf-8");
    } catch (e: any) {
      return `<html><body><h3>未找到构建资源，请先执行 build</h3><pre>${e?.message}</pre></body></html>`;
    }

    // Replace resource paths
    html = html.replace(
      /(href|src)="\/([^"]*)"/g,
      (_, attr, path) =>
        `${attr}="${webviewView.webview.asWebviewUri(
          vscode.Uri.joinPath(distUri, path)
        )}"`
    );

    // Inject config script
    html = html.replace("</head>", `<script>${configScript}</script></head>`);

    return html;
  }
}
