// 处理裸导入
import { init, parse as parseModule } from 'es-module-lexer';
import MagicString from 'magic-string';
import fs from 'fs';
import path from 'path';
import { buildSync } from 'esbuild';
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
        }
        // else {
        //   s.overwrite(item.s, item.e, `${item.n}?import`);
        // }
    });
    return s.toString();
};
export const modulePlugin = (context) => {
    console.log(context.basePath);
    context.app.use(async (ctx) => {
        console.log(ctx.path);
        if (ctx.path === '/main.js') {
            let js = fs.readFileSync(path.join(context.basePath, 'main.js'), 'utf-8');
            ctx.set('Content-Type', 'application/javascript');
            ctx.status = 200;
            ctx.body = js;
            return;
        }
        if (/\.js\??[^.]*$/.test(ctx.path)) {
            ctx.set('Content-Type', 'application/javascript');
            ctx.status = 200;
            ctx.body = await parseBareImport(ctx.body);
            return;
        }
        // 拦截/@module请求
        if (/^\/@module\//.test(ctx.path)) {
            let pkg = ctx.path.substring(ctx.path.indexOf('/@module/') + 9, ctx.path.indexOf('?import'));
            // 获取该模块的package.json
            let pkgJson = JSON.parse(fs.readFileSync(path.join(context.basePath, "node_modules", pkg, "package.json"), "utf8"));
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
            ctx.set('Content-Type', 'application/javascript');
            ctx.status = 200;
            ctx.body = js;
            return;
        }
    });
};
//# sourceMappingURL=modulePlugin.js.map