import path from 'path';
import dotenv from 'dotenv';
import { parse } from 'es-module-lexer';
export const loadEnv = (env, basePath = process.cwd()) => {
    const envFile = path.resolve(basePath, `.env.${env}`);
    const envConfig = dotenv.config({ path: envFile });
    return envConfig.parsed;
};
export const handleEnv = (js, env) => {
    const [imports] = parse(js);
    imports.forEach((item) => {
        const source = js.slice(item.ss, item.se);
        if (source === 'import.meta') {
            // 在源代码source中注入import.meta.env
            let envStr = `import.meta.env = ${JSON.stringify(env)};`;
            js = envStr + js;
        }
    });
    return js;
};
//# sourceMappingURL=env.js.map