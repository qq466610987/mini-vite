// 处理裸导入
import { init, parse as parseModule } from 'es-module-lexer';
import MagicString from 'magic-string';
import fs from 'fs';
import path from 'path';
import { buildSync } from 'esbuild';
import { parseEnv } from '../utils/env.js';
// 处理裸导入问题
export const parseBareImport = async (js) => {
    await init;
    let parseResult = parseModule(js);
    let s = new MagicString(js);
    // 遍历导入语句
    parseResult[0].forEach((item) => {
        // 裸导入 eg: import { createApp } from 'vue'
        // 添加 /@module/ 前缀,以及 ?import 后缀(标识是js文件中import导入的)
        if (item.n[0] !== "." && item.n[0] !== "/") {
            s.overwrite(item.s, item.e, `/@module/${item.n}?import`);
        }
        // 相对导入 eg: import { createApp } from './app.js'
        else {
            s.overwrite(item.s, item.e, `${item.n}?import`);
        }
    });
    return s.toString();
};
export const modulePlugin = (context) => {
    context.app.use(async (ctx, next) => {
        if (/\.js\??[^.]*$/.test(ctx.path)) {
            let js = fs.readFileSync(path.join(context.basePath, ctx.path), 'utf-8');
            let result = await parseBareImport(js);
            // 解析环境变量
            parseEnv(result);
            //end 
            ctx.type = 'application/javascript';
            console.log(result);
            ctx.body = result;
            return;
        }
        // 拦截/@module请求
        if (/^\/@module\//.test(ctx.path)) {
            let pkg = ctx.path.substring(ctx.path.indexOf('/@module/') + 9);
            // 获取该模块的package.json
            let pkgJson = JSON.parse(fs.readFileSync(path.join(context.root, "node_modules", pkg, "package.json"), "utf8"));
            // 找出该模块的入口文件
            let entry = pkgJson.module || pkgJson.main;
            // 使用esbuild编译
            let outfile = path.join(`./esbuild/${pkg}.js`);
            buildSync({
                entryPoints: [path.join(context.root, "node_modules", pkg, entry)],
                format: "esm",
                bundle: true,
                outfile,
            });
            let js = fs.readFileSync(outfile, "utf8");
            ctx.type = 'application/javascript';
            ctx.body = js;
            return;
        }
        await next();
    });
};
//# sourceMappingURL=modulePlugin.js.map