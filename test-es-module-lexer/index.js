import { init, parse } from 'es-module-lexer'
(async () => {
  await init
  const [imports, exports] = parse('import { add } from "./a.js"')
  await init
  console.log(result)
})()