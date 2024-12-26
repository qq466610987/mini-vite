import type Koa from 'koa'
import { htmlPlugin } from './htmlPlugin.js'
import { modulePlugin } from './modulePlugin.js'
import { cssPlugin } from './cssPlugin.js'
import { vuePlugin } from './vuePlugin.js'

export interface PluginContext {
  root: string // 项目根目录
  app: Koa
  basePath: string // play目录
  env: Record<string, string> // 环境变量
  envModel: String
}

export const plugins = (ctx: PluginContext) => {
  return [htmlPlugin, modulePlugin, cssPlugin, vuePlugin]
}