import path from 'path'
import dotenv from 'dotenv'
import { parse } from 'es-module-lexer'

export const loadEnv = (env: string, basePath = process.cwd()) => {
  const envFile = path.resolve(basePath, `.env.${env}`)
  const envConfig = dotenv.config({ path: envFile })
  import.meta.env = envConfig.parsed
  console.log('import.meta.env', import.meta.env)
  return envConfig
}

export const parseEnv = (js: string) => {
  const [imports] = parse(js)
  imports.forEach((item) => {
    const source = js.slice(item.ss, item.se)
    console.log(source)
  })
}
