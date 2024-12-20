import fs from 'fs';
import path from 'path';
export const htmlPlugin = (context) => {
    context.app.use(async (ctx, next) => {
        if (ctx.path === '/index.html') {
            let html = fs.readFileSync(path.join(context.basePath, "index.html"), "utf-8");
            // 后续注入client.js
            // const devInjectionCode = `\n<script type="module">import "${clientPublicPath}"</script>\n`;
            // html = html.replace(/<head>/, `$&${devInjectionCode}`);
            ctx.set("Content-Type", "text/html");
            ctx.status = 200;
            ctx.body = html;
            return;
        }
        // 这里为什么要await next()，而不直接next()
        // 因为 直接 next()会造成后续的middleware还没有执行完成，这里就已经返回了,
        // 造成404
        await next();
    });
};
//# sourceMappingURL=htmlPlugin.js.map