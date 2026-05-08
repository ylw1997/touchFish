const fs = require("node:fs");
const path = require("node:path");

function createConfigStore(filePath) {
  // 支持通过环境变量或参数指定路径
  const finalPath = filePath ||
    process.env.CONFIG_PATH ||
    path.join(process.cwd(), "data", "config.json");

  function readAll() {
    if (!fs.existsSync(finalPath)) return {};
    return JSON.parse(fs.readFileSync(finalPath, "utf8").replace(/^\uFEFF/, ""));
  }

  function writeAll(next) {
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.writeFileSync(finalPath, JSON.stringify(next, null, 2));
  }

  return {
    get(key) {
      const current = readAll();
      return current[key] ?? current[`touchfish.${key}`];
    },
    set(key, value) {
      const current = readAll();
      current[key] = value;
      writeAll(current);
      return current[key];
    },
    all() {
      const current = readAll();
      return Object.fromEntries(
        Object.entries(current).map(([key, value]) => [
          key,
          typeof value === "string" && value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : value,
        ]),
      );
    },
  };
}

module.exports = { createConfigStore };
