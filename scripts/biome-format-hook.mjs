// Claude Code PostToolUse フック。編集されたファイルを Biome で整形＋安全な lint 修正する。
// Claude Code が stdin に渡す JSON から file_path を取り出し、対象拡張子のみ biome を実行する。
// 整形が失敗しても編集自体はブロックしないよう、常に exit 0 で終える。
import { spawnSync } from 'node:child_process';

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css'];

let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let filePath;
  try {
    filePath = JSON.parse(raw || '{}')?.tool_input?.file_path;
  } catch {
    process.exit(0);
  }

  if (!filePath || !EXTENSIONS.some((ext) => filePath.endsWith(ext))) {
    process.exit(0);
  }

  spawnSync('npx', ['--no-install', '@biomejs/biome', 'check', '--write', filePath], {
    stdio: 'ignore',
  });
  process.exit(0);
});
