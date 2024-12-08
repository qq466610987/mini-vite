import connect from 'connect'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { init, parse as parseModule } from 'es-module-lexer'
import MagicString from 'magic-string'
import { buildSync } from 'esbuild'

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
      } else {
        s.overwrite(item.s, item.e, `${item.n}?import`);
      }
    });
    res.setHeader("Content-Type", typeAlias.js);
    res.statusCode = 200;
    res.end(s.toString());
  }
  if (/^\/@module\//.test(req.url)) {
    // 拦截/@module请求
    // 去除url的查询参数
    const removeQuery = (url) => {
      return url.split("?")[0];
    };
    let pkg = removeQuery(req.url.slice(9));// 从/@module/vue?import中解析出vue
    // 获取该模块的package.json
    let pkgJson = JSON.parse(
      fs.readFileSync(
        path.join(path.resolve(__dirname), "node_modules", pkg, "package.json"),
        "utf8"
      )
    );
    // 找出该模块的入口文件
    let entry = pkgJson.module || pkgJson.main;
    // 使用esbuild编译
    let outfile = path.join(`./esbuild/${pkg}.js`);
    buildSync({
      entryPoints: [path.join(__dirname, "node_modules", pkg, entry)],
      format: "esm",
      bundle: true,
      outfile,
    });
    let js = fs.readFileSync(outfile, "utf8");
    res.setHeader("Content-Type", typeAlias.js);
    res.statusCode = 200;
    res.end(js);
  }

  if (/\.css\??[^.]*$/.test(req.url)) {
    // 拦截css请求
    let cssRes = fs.readFileSync(
      path.join(basePath, req.url.split("?")[0]),
      "utf-8"
    );
    if (checkQueryExist(req.url, "import")) {
      // import请求，返回js文件
      cssRes = `
            const insertStyle = (css) => {
                let el = document.createElement('style')
                el.setAttribute('type', 'text/css')
                el.innerHTML = css
                document.head.appendChild(el)
            }
            insertStyle(\`${cssRes}\`)
            export default insertStyle
        `;
      res.setHeader("Content-Type", typeAlias.js);
    } else {
      // link请求，返回css文件
      res.setHeader("Content-Type", typeAlias.css);
    }
    res.statusCode = 200;
    res.end(cssRes);
  }

  if (req.url === '/') {
    res.end("Hello world")
  }
})
// 判断url的某个query名是否存在
const checkQueryExist = (url, key) => {
  return new URL(path.resolve(basePath, url)).searchParams.has(key);
};
// 创建一个node.js http 服务，监听3000端口
http.createServer(app).listen(3000)
console.log('Server running at http://localhost:3000')


