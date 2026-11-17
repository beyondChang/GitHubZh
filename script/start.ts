import webpack from 'webpack'
import DevMiddleware from 'webpack-dev-middleware'
import HotMiddleware from 'webpack-hot-middleware'

import { forceUnwrap as u } from '../app/src/lib/fatal-error'

import configs from '../app/webpack.development'

import { run } from './run'
import { createServer } from 'http'
import { spawn } from 'child_process'
import { join } from 'path'

function getPortOrDefault() {
  const port = process.env.PORT
  if (port != null) {
    const result = parseInt(port)
    if (isNaN(result)) {
      throw new Error(`Unable to parse '${port}' into valid number`)
    }
    return result
  }

  return 3000
}

function startApp() {
  let runningApp = run({ stdio: 'inherit' })
  if (runningApp == null) {
    const electronPath = join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe')
    const outPath = join(process.cwd(), 'out')
    console.log('dist missing, falling back to electron + out: ' + outPath)
    runningApp = spawn(electronPath, [outPath], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
    })
  }

  runningApp.on('close', () => {
    process.exit(0)
  })
}

if (process.env.NODE_ENV === 'production') {
  startApp()
} else {
  const rendererConfig = configs[1]
  const compiler = webpack(rendererConfig)
  const port = getPortOrDefault()
  const message = 'Could not find public path from configuration'

  const devMiddleware = DevMiddleware(compiler, {
    publicPath: u(
      message,
      u(message, u(message, rendererConfig).output).publicPath
    ),
  })

  const hotMiddleware = HotMiddleware(compiler)

  const server = createServer((req, res) => {
    devMiddleware(req, res, () => {
      hotMiddleware(req, res, () => {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not found')
      })
    })
  })

  server.listen(port, 'localhost')
  server.on('listening', () => {
    console.log(`Server running at http://localhost:${port}`)
    startApp()
  })
  server.on('error', (err: Error) => {
    console.error(err)
    process.exit(1)
  })
}
