import fs from 'fs';
import path from 'path';
export const htmlPlugin = (context) => {
    context.app.use((ctx) => {
        if (ctx.path === '/index.html') {
            let html = fs.readFileSync(path.join(context.basePath, "index.html"), "utf-8");
            // 后续注入client.js
            // const devInjectionCode = `\n<script type="module">import "${clientPublicPath}"</script>\n`;
            // html = html.replace(/<head>/, `$&${devInjectionCode}`);
            ctx.set("Content-Type", "text/html");
            ctx.status = 200;
            ctx.body = html;
        }
    });
};
//# sourceMappingURL=htmlPlugin.js.map