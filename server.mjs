import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const ROOT = resolve(process.cwd(), 'dist')
const PORT = Number(process.env.PORT ?? 3000)
const HOST = process.env.HOST ?? '0.0.0.0'

// 只有根路径回退到 SPA；其余未知路径返回真 404,避免软 404 污染收录。
function isSpaRoute(pathname) {
  return pathname === '/' || pathname === '/index.html'
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    let pathname = decodeURIComponent(url.pathname)

    // 防目录穿越
    pathname = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
    let filePath = join(ROOT, pathname)

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    let info = await stat(filePath).catch(() => null)
    if (info?.isDirectory()) {
      filePath = join(filePath, 'index.html')
      info = await stat(filePath).catch(() => null)
    }

    // 根路径回退到 SPA；其余未知路径给真 404
    if (!info) {
      if (isSpaRoute(pathname)) {
        filePath = join(ROOT, 'index.html')
        info = await stat(filePath).catch(() => null)
      }
    }
    if (!info) {
      const notFound = join(ROOT, '404.html')
      const has404 = await stat(notFound).catch(() => null)
      if (has404) {
        const body404 = await readFile(notFound)
        res.writeHead(404, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': body404.length,
        }).end(body404)
      } else {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found')
      }
      return
    }

    const body = await readFile(filePath)
    const type = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
    res.writeHead(200, {
      'content-type': type,
      'content-length': body.length,
      'cache-control': pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=300',
    })
    res.end(body)
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Server error')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`palette-extractor serving ${ROOT} on http://${HOST}:${PORT}`)
})
