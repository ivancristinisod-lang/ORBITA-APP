import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".json":"application/json; charset=utf-8" };

http.createServer(async (req,res) => {
  try {
    let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname === "/") pathname = "/index.html";
    if (pathname === "/assets/orbita-mark.svg") pathname = "/orbita-mark.svg";
    let file = path.join(root, pathname.replace(/^\/+/, ""));
    if (!file.startsWith(root)) throw new Error("Invalid path");
    try { const info = await stat(file); if (info.isDirectory()) file = path.join(file,"index.html"); }
    catch { file = path.join(root,"index.html"); }
    const body = await readFile(file);
    res.writeHead(200,{"Content-Type":types[path.extname(file)] || "application/octet-stream","Cache-Control":"no-store"});
    res.end(body);
  } catch {
    res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Not found");
  }
}).listen(port,()=>console.log(`ORBITA dev → http://localhost:${port}`));
