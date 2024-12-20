import { PluginContext } from './index';
import { compileScript, compileStyle, compileTemplate, parse, rewriteDefault } from '@vue/compiler-sfc'
import fs from 'fs'
import path from 'path'
import { parseBareImport } from './modulePlugin.js'

export const vuePlugin = (context: PluginContext) => {
  context.app.use(async (ctx, next) => {
    if (/\.vue\??[^.]*$/.test(ctx.path)) {
      let vueRes = fs.readFileSync(
        path.join(context.basePath, ctx.path),
        "utf-8"
      );
      let result = ''
      let { descriptor } = parse(vueRes);
      // js部分
      let scriptRes = compileScript(descriptor)
      if (scriptRes) {
        let bareJs = await parseBareImport(scriptRes.content)
        scriptRes.content = rewriteDefault(bareJs, "__script");
      }
      result += scriptRes.content
      // template部分
      // 把template部分转换为一个import请求,交给后续处理
      let templateRequest = ctx.path + `?type=template`
      result += `\nimport { render as __render } from ${JSON.stringify(templateRequest)}`
      result += `\n__script.render = __render`
      // style部分
      // 也转换为一个单独的请求
      let styleRequest = ctx.path + `?type=style`
      result += `\nimport ${JSON.stringify(styleRequest)}`
      // 最终把__script作为默认导出
      result += `\nexport default __script`
      ctx.type = 'application/javascript'
      ctx.body = result
    }
    await next()
  })
}