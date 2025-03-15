import path from "path";
import chokidar from "chokidar";
import { parseFile } from "./parser";

const watchPaths = path.resolve("src");

const watcher = chokidar.watch(watchPaths, {
  ignored: /node_modules/,
  persistent: true,
});

watcher
  .on("ready", () => console.log("✅ 파일 감시가 시작되었습니다!"))
  .on("add", parseFile)
  .on("change", parseFile)
  .on("unlink", parseFile);

console.log("🔍 파일 감시 중...");
