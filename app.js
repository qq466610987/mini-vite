import connect from 'connect'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { init, parse as parseModule } from 'es-module-lexer'
import MagicString from 'magic-string'
// 将 import.meta.url（文件的 URL）转换为文件路径
const __filename = fileURLToPath(import.meta.url)
// 获取当前文件所在的目录路径
const __dirname = path.dirname(__filename)
// 解析出 'play' 目录的完整路径
const basePath = path.resolve(__dirname, 'play')

const typeAlias = {
  js: "application/javascript",
  css: "text/css",
  html: "text/html",
  json: "application/json",
};


const app = new connect()
app.use(async (req, res) => {
  if (req.url === '/index.html') {
    let html = fs.readFileSync(path.join(basePath, "index.html"), "utf-8");
    res.setHeader("Content-Type", typeAlias.html);
    res.statusCode = 200;
    res.end(html);
  }
  if (/\.js\??[^.]*$/.test(req.url)) {
    // js请求
    let js = fs.readFileSync(path.join(basePath, req.url), "utf-8");
    await init;
    let parseResult = parseModule(js);
    console.log(parseResult)
    // ...
    let s = new MagicString(js);
    // 遍历导入语句
    parseResult[0].forEach((item) => {
      // 不是裸导入则替换
      if (item.n[0] !== "." && item.n[0] !== "/") {
        s.overwrite(item.s, item.e, `/@module/${item.n}`);
      }
    });
    res.setHeader("Content-Type", typeAlias.js);
    res.statusCode = 200;
    res.end(s.toString());
  }
  if (req.url === '/') {
    res.end("Hello world")
  }
})
// 创建一个node.js http 服务，监听3000端口
http.createServer(app).listen(3000)
console.log('Server running at http://localhost:3000')


