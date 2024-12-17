import connect from 'connect'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { init, parse as parseModule } from 'es-module-lexer'
import MagicString from 'magic-string'
import { buildSync } from 'esbuild'
import { parse as parseVueSfc, compileScript, rewriteDefault, compileTemplate } from '@vue/compiler-sfc'
import serveStatic from 'serve-static'
import * as WebSocket from 'ws'
import chokidar from 'chokidar'

// 将 import.meta.url（文件的 URL）转换为文件路径
const __filename = fileURLToPath(import.meta.url)
// 获取当前文件所在的目录路径
const __dirname = path.dirname(__filename)
// 解析出 'play' 目录的完整路径
const basePath = path.resolve(__dirname, 'play')
const clientPublicPath = "/client.js";

const typeAlias = {
  js: "application/javascript",
  css: "text/css",
  html: "text/html",
  json: "application/json",
};

// 处理裸导入问题
const parseBareImport = async (js) => {
  await init;
  let parseResult = parseModule(js);
  let s = new MagicString(js);
  // 遍历导入语句
  parseResult[0].forEach((item) => {
    // 不是裸导入则替换
    if (item.n[0] !== "." && item.n[0] !== "/") {
      s.overwrite(item.s, item.e, `/@module/${item.n}?import`);
    } else {
      s.overwrite(item.s, item.e, `${item.n}?import`);
    }
  });
  return s.toString();
};

const app = new connect()
app.use(async (req, res, next) => {
  if (req.url === '/index.html') {
    let html = fs.readFileSync(path.join(basePath, "index.html"), "utf-8");
    // 注入client.js
    const devInjectionCode = `\n<script type="module">import "${clientPublicPath}"</script>\n`;
    html = html.replace(/<head>/, `$&${devInjectionCode}`);
    res.setHeader("Content-Type", typeAlias.html);
    res.statusCode = 200;
    res.end(html);
  }
  // 提供client.js
  if (req.url === clientPublicPath) {
    // 提供client.js
    let js = fs.readFileSync(path.join(__dirname, "./client.js"), "utf-8");
    res.setHeader("Content-Type", typeAlias.js);
    res.statusCode = 200;
    res.end(js);
    return
  }
  // 如果是请求的裸js文件，重写js文件的import部分，添加 @module前缀
  if (/\.js\??[^.]*$/.test(req.url)) {
    // js请求
    let js = fs.readFileSync(path.join(basePath, req.url), "utf-8");
    const bareJs = await parseBareImport(js) // 处理后的js代码
    res.setHeader("Content-Type", typeAlias.js);
    res.statusCode = 200;
    res.end(bareJs);
    return
  }
  if (/^\/@module\//.test(req.url)) {
    // 拦截/@module请求
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
    return
  }

  if (/\.css\??[^.]*$/.test(req.url)) {
    // 拦截css请求
    let cssRes = fs.readFileSync(
      path.join(basePath, req.url.split("?")[0]),
      "utf-8"
    );
    if (checkQueryExist(req.url, "import")) {
      // import请求，返回js文件, 将css直接插入到html中
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
    return
  }

  // 解析vue sfc请求
  if (/\.vue\??[^.]*$/.test(req.url)) {
    // Vue单文件
    let vue = fs.readFileSync(
      path.join(basePath, removeQuery(req.url)),
      "utf-8"
    );
    let { descriptor } = parseVueSfc(vue);
    let code = "";
    // 处理模板请求
    if (getQuery(req.url, "type") === "template") {
      // 编译模板为渲染函数
      code = compileTemplate({
        source: descriptor.template.content,
      }).code;
      code = await parseBareImport(code);
      res.setHeader("Content-Type", typeAlias.js);
      res.statusCode = 200;
      res.end(code);
      return;
    }
    // 处理js部分
    let script = compileScript(descriptor);
    if (script) {
      // 处理script标签内的裸导入问题
      const bareJs = await parseBareImport(script.content)
      code += rewriteDefault(bareJs, "__script");
    }
    // 处理template
    if (descriptor.template) {
      let templateRequest = removeQuery(req.url) + `?type=template`;
      code += `\nimport { render as __render } from ${JSON.stringify(
        templateRequest
      )}`;
      code += `\n__script.render = __render`;
    }
    // 处理样式
    if (descriptor.styles) {
      descriptor.styles.forEach((s, i) => {
        const styleRequest = removeQuery(req.url) + `?type=style&index=${i}`;
        code += `\nimport ${JSON.stringify(styleRequest)}`
      })
    }
    code += `\nexport default __script`;


    res.setHeader("Content-Type", typeAlias.js);
    res.statusCode = 200;
    res.end(code);
    return
  }
  if (isStaticAsset(req.url) && checkQueryExist(req.url, "import")) {
    // import导入的静态文件
    res.setHeader("Content-Type", typeAlias.js);
    res.statusCode = 200;
    res.end(`export default ${JSON.stringify(removeQuery(req.url))}`);
    return
  }
  if (req.url === '/') {
    res.end("Hello world")
  } else {
    next()
  }

})
// 判断url的某个query名是否存在
const checkQueryExist = (url, key) => {
  return new URL(path.resolve(basePath, url)).searchParams.has(key);
};
// 去除url的查询参数
const removeQuery = (url) => {
  return url.split("?")[0];
};
// 获取url的某个query值
const getQuery = (url, key) => {
  return new URL(path.resolve(basePath, url)).searchParams.get(key);
};
// 检查是否是静态文件
const imageRE = /\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/;
const mediaRE = /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/;
const fontsRE = /\.(woff2?|eot|ttf|otf)(\?.*)?$/i;
const isStaticAsset = (file) => {
  return imageRE.test(file) || mediaRE.test(file) || fontsRE.test(file);
};

//静态文件服务
app.use(serveStatic(path.join(basePath, "public")));
app.use(serveStatic(path.join(basePath)));
// 创建一个node.js http 服务，监听3000端口

console.log('Server running at http://localhost:3000')
const server = http.createServer(app);
// 创建WebSocket服务
const createWebSocket = () => {
  // 创建一个服务实例
  const wss = new WebSocket.WebSocketServer({ noServer: true });// 不用额外创建http服务，直接使用我们自己创建的http服务

  // 接收到http的协议升级请求
  server.on("upgrade", (req, socket, head) => {
    // 当子协议为vite-hmr时就处理http的升级请求
    if (req.headers["sec-websocket-protocol"] === "vite-hmr") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  // 连接成功
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "connected" }));
  });


  // 发送消息方法
  const sendMsg = (payload) => {
    const stringified = JSON.stringify(payload, null, 2);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(stringified);
      }
    });
  };

  return {
    wss,
    sendMsg,
  };
};
const { wss, sendMsg } = createWebSocket();

server.listen(3000);

// 创建文件监听服务
const createFileWatcher = () => {
  const watcher = chokidar.watch(basePath, {
    ignored: [/node_modules/, /\.git/],
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 10,
    },
  });
  return watcher;
};
const watcher = createFileWatcher();

watcher.on("change", (file) => {
  // file文件修改了
})
