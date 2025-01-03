import koa from 'koa';
import { plugins } from './plugin/index.js';
import path from 'path';
import { loadEnv } from './utils/env.js';
const createServer = (options = {}) => {
    // 加载环境变量
    const env = loadEnv(options.env || 'development', path.resolve(process.cwd(), 'play'));
    console.log(env);
    console.log(options);
    const app = new koa();
    const context = {
        root: path.resolve(process.cwd()),
        app,
        basePath: path.resolve(process.cwd(), 'play'),
        envModel: options.env || 'development',
        env: env || {}
    };
    // 初始化插件
    plugins(context).forEach(plugin => plugin(context));
    // app.use(async (ctx, next) => {
    //   await next()
    //   if (!ctx.body) {
    //     ctx.body = 'Hello World'
    //   }
    // })
    // 添加错误处理
    const server = app.listen(3000, () => {
        console.log('Server started on port 3000');
    }).on('error', (err) => {
        console.log('Server error:', err);
        server.close();
    });
    return server; // 返回服务器实例以便管理
};
export { createServer };
//# sourceMappingURL=app.js.map