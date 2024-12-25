import { init, parse } from 'es-module-lexer'
(async () => {
  await init
  const [imports, exports] = parse('import { add } from "./a.js"; import.meta.env.VITE_ENV = "test"')
  await init
  console.log(imports)
})()
