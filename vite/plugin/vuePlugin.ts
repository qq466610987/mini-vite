import { PluginContext } from './index.js';
import { compileScript, compileStyle, compileTemplate, parse, rewriteDefault } from 'vue/compiler-sfc'
import fs from 'fs'
import path from 'path'
import { parseBareImport } from './modulePlugin.js'
import { hash } from '../utils/index.js'

export const vuePlugin = (context: PluginContext) => {
  context.app.use(async (ctx, next) => {
    if (/\.vue\??[^.]*$/.test(ctx.path)) {
      let source = fs.readFileSync(
        path.join(context.basePath, ctx.path),
        "utf-8"
      );
      let result = ''
      let { descriptor } = parse(source);
      let id = hash(path.resolve(context.basePath, descriptor.filename))
      descriptor.id = id
      // js部分
      let scriptRes = compileScript(descriptor, {
        id: descriptor.id,
        isProd: false,
      })
      if (scriptRes) {
        let bareJs = await parseBareImport(scriptRes.content)
        scriptRes.content = rewriteDefault(bareJs, "__script");
      }
      result += scriptRes.content
      // template部分,把template部分转换为一个render函数
      let templateRender
      if (descriptor.template) {
        templateRender = compileTemplate({
          id: descriptor.id,
          filename: descriptor.filename,
          source: descriptor.template?.content
        }).code
        templateRender = await parseBareImport(templateRender)
      }
      result += `\n${templateRender}`
      result += `\n__script.render = render`
      // style部分,转换为一个单独的请求
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