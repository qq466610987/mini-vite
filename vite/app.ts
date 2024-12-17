import koa from 'koa'
import { plugins, type PluginContext } from './plugin/index.js'
import path from 'path'

const createServer = () => {
  const app = new koa()
  const context: PluginContext = {
    root: process.cwd(),
    app,
    basePath: path.resolve(process.cwd(), '../', 'play')
  }
  // 初始化插件
  plugins(context).forEach(plugin => plugin(context))

  app.use((ctx) => {
    ctx.body = 'Hello World'
  })
  app.listen(3000)
}
createServer()
export { createServer }