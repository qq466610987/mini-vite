#!/usr/bin/env node
import { createServer } from '../vite/dist/app.js'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))

createServer(args)
