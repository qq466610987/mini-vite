import type Koa from 'koa'
import { htmlPlugin } from './htmlPlugin.js'
import { modulePlugin } from './modulePlugin.js'

export interface PluginContext {
  root: string // 项目根目录
  app: Koa
  basePath: string // play目录
}

export const plugins = (ctx: PluginContext) => {
  return [htmlPlugin, modulePlugin]
}