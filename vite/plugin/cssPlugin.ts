import { PluginContext } from './index';
import fs from "fs";
import path from "path";
import sass from 'sass'

export const cssPlugin = (context: PluginContext) => {
  context.app.use(async (ctx, next) => {
    if (/\.css\??[^.]*$/.test(ctx.path)) {
      let cssRes = fs.readFileSync(
        path.join(context.basePath, ctx.path),
        "utf-8"
      );
      cssRes = codeGenCss(cssRes)
      ctx.type = 'application/javascript'
      ctx.body = cssRes
      return
    }
    if (/\.scss\??[^.]*$/.test(ctx.path)) {
      let scssRes = fs.readFileSync(
        path.join(context.basePath, ctx.path),
        "utf-8"
      );
      const result = codeGenCss(sass.compileString(scssRes).css.toString())
      ctx.type = 'application/javascript'
      ctx.body = result
      return
    }
    await next()
  })
}

const codeGenCss = (css: string) => {
  return `
    const insertStyle = (css) => {
        console.log(css)
        let el = document.createElement('style')
        el.setAttribute('type', 'text/css')
        el.innerHTML = css
        document.head.appendChild(el)
    }
    insertStyle(\`${css}\`)
    export default insertStyle
  `
}
