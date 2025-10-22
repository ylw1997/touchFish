import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // 根目录 (extensionDevelopmentPath)
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    // 测试入口 (extensionTestsPath) 指向已编译的 suite/index
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.error('Failed to run VS Code tests');
    console.error(err);
    process.exit(1);
  }
}

main();
