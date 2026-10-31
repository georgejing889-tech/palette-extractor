// Prerender the built SPA: render each route with headless Chrome, then write
// the real DOM back into the built HTML so crawlers without JS see content.
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'

const ROOT = resolve(process.cwd(), 'dist')
const PORT = Number(process.env.PRERENDER_PORT ?? 5199)
const CHROME = process.env.CHROME_BIN ?? '/usr/bin/google-chrome'

// Routes to prerender. Add new content pages here as they are built.
const ROUTES = [
  { path: '/', out: 'index.html' },
  { path: '/palette-generator', out: 'palette-generator/index.html' },
  { path: '/colorblind-simulator', out: 'colorblind-simulator/index.html' },
  { path: '/contrast-checker', out: 'contrast-checker/index.html' },
  // 教程页（纯内容，SEO 长尾）
  { path: '/how-to-extract-color-from-image', out: 'how-to-extract-color-from-image/index.html' },
  { path: '/color-palette-guide', out: 'color-palette-guide/index.html' },
  // 英文版（/en/ 前缀），独立 URL 吃英文长尾
  { path: '/en/', out: 'en/index.html' },
  { path: '/en/palette-generator', out: 'en/palette-generator/index.html' },
  { path: '/en/colorblind-simulator', out: 'en/colorblind-simulator/index.html' },
  { path: '/en/contrast-checker', out: 'en/contrast-checker/index.html' },
  { path: '/en/how-to-extract-color-from-image', out: 'en/how-to-extract-color-from-image/index.html' },
  { path: '/en/color-palette-guide', out: 'en/color-palette-guide/index.html' },
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

// Serve dist/ so Chrome can load the built assets over http (module scripts
// refuse to load from file://).
function serve() {
  return new Promise((resolveReady) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
        let p = decodeURIComponent(url.pathname)
        if (process.env.DEBUG_PRERENDER) console.error(`[SERVE] ${req.method} ${url.pathname}`)
        if (p === '/') p = '/index.html'
        let file = join(ROOT, p)
        if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
        let info = await stat(file).catch(() => null)
        if (process.env.DEBUG_PRERENDER) console.error(`[SERVE] stat ${url.pathname}: ${info ? (info.isDirectory() ? 'DIR' : 'FILE') : 'MISSING'}`)
        // 目录或未找到 → 回退到 index.html，让 React 路由接管渲染。
        // 注意：/palette-generator 在 dist 里已是目录（上一轮预渲染创建），
        // stat 会成功但 readFile 读目录会抛 EISDIR，所以 isDirectory() 也要回退。
        if (!info || info.isDirectory()) {
          p = '/index.html'
          file = join(ROOT, 'index.html')
          info = await stat(file).catch(() => null)
          if (process.env.DEBUG_PRERENDER) console.error(`[SERVE] fallback ${url.pathname} -> ${info ? 'ok' : 'STILL MISSING'}`)
        }
        if (!info) {
          if (process.env.DEBUG_PRERENDER) console.error(`[SERVE] ${url.pathname} -> 404`)
          res.writeHead(404).end('Not found'); return
        }
        const body = await readFile(file)
        if (process.env.DEBUG_PRERENDER) console.error(`[SERVE] ${url.pathname} -> 200 ${file} (${body.length}b)`)
        res.writeHead(200, {
          'content-type': MIME[extname(file)] ?? 'application/octet-stream',
          'content-length': body.length,
        })
        res.end(body)
      } catch { res.writeHead(500).end() }
    })
    server.listen(PORT, '127.0.0.1', () => resolveReady(server))
  })
}

function render(url) {
  return new Promise((resolveReady, reject) => {
    const proc = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      '--virtual-time-budget=12000',
      '--dump-dom', url,
    ], { stdio: ['ignore', 'pipe', 'ignore'] })
    let out = ''
    proc.stdout.on('data', (d) => { out += d })
    proc.on('error', reject)
    proc.on('close', () => resolveReady(out))
  })
}

// Replace the empty <div id="root"></div> with the rendered DOM while keeping
// the head intact (title/description/meta stay as authored).
function injectRendered(original, rendered) {
  const start = rendered.indexOf('<div id="root">')
  const end = rendered.indexOf('</body>')
  if (start < 0 || end < 0) return original
  const rootHtml = rendered.slice(start, end)
  return original.replace('<div id="root"></div>', rootHtml)
}


// 为功能页生成独立 HTML：复用渲染后的 body 内容，但 head 使用该页专属 title/description。
// 这样每页都有独立的 <title>/<meta description>，而非全部复用首页的。
const PAGE_META = {
  '/palette-generator': {
    title: 'Random Color Palette Generator - Harmonious Schemes | ColorExtract',
    desc: 'Generate harmonious random color palettes from your palette. Free, local, exportable to CSS, PNG or JSON.',
  },
  '/colorblind-simulator': {
    title: 'Colorblind Simulator - Preview Your Palette for CVD | ColorExtract',
    desc: 'Preview how your color palette looks under color vision deficiencies. Free online simulator, local processing.',
  },
  '/contrast-checker': {
    title: 'WCAG Contrast Checker - Check Text Readability | ColorExtract',
    desc: 'Check foreground and background contrast against WCAG AA and AAA. Free online contrast checker.',
  },
  '/how-to-extract-color-from-image': {
    title: '如何从图片提取配色：完整图文教程（2026）| ColorExtract',
    desc: '从任意图片提取专业配色方案，支持 5-10 色、多种提取模式，导出 HEX/RGB/HSL、CSS 变量、PNG 和 JSON。全程本地处理，不上传图片。',
  },
  '/color-palette-guide': {
    title: '配色方案指南：互补、类似、三色与如何应用（2026）| ColorExtract',
    desc: '系统了解常用配色方案——互补色、类似色、三等分色、分裂互补色、单色系，以及如何在网页和品牌设计中正确应用，搭配 WCAG 对比度检查。',
  },
}

// 英文版功能页独立 title/desc（/en/ 前缀路由用，覆盖中文 meta）
const EN_META = {
  '/': {
    title: 'Image Color Palette Extractor - Extract Colors from Images | ColorExtract',
    desc: 'Extract a professional color palette from any image in seconds. Upload, pick 5-10 colors, copy HEX/RGB/HSL, export CSS variables, PNG or JSON. Free, local, no signup.',
  },
  '/palette-generator': {
    title: 'Random Color Palette Generator - Harmonious Color Schemes | ColorExtract',
    desc: 'Generate harmonious color palettes from any base color. Complementary, analogous, triadic, split-complementary and monochromatic schemes. Copy or export instantly.',
  },
  '/colorblind-simulator': {
    title: 'Colorblind Simulator - Check Your Palette for Color Vision Deficiencies | ColorExtract',
    desc: 'Preview your color palette under protanopia, deuteranopia, tritanopia and achromatopsia. Essential accessibility check for designers before shipping.',
  },
  '/contrast-checker': {
    title: 'WCAG Contrast Checker - Check Text Readability Online | ColorExtract',
    desc: 'Check foreground and background color contrast against WCAG AA and AAA levels. Live ratio calculator with preview. Free and instant.',
  },
  '/how-to-extract-color-from-image': {
    title: 'How to Extract Colors from an Image: Complete Tutorial (2026) | ColorExtract',
    desc: 'Extract a professional color palette from any image. 5-10 colors, multiple modes, export HEX/RGB/HSL, CSS variables, PNG and JSON. 100% local, nothing uploaded.',
  },
  '/color-palette-guide': {
    title: 'Color Scheme Guide: Complementary, Analogous, Triadic & How to Apply (2026) | ColorExtract',
    desc: 'A systematic guide to color schemes — complementary, analogous, triadic, split-complementary and monochromatic — with web and brand design tips, plus WCAG contrast checks.',
  },
}

// 英文首页 FAQ JSON-LD（/en/ 用，SEO 结构化数据）
const EN_FAQ_LD = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is ColorExtract free? Do I need to sign up?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, completely free with no signup. All color extraction and palette features work online without uploading your image to any server."
      }
    },
    {
      "@type": "Question",
      "name": "Are my images uploaded to a server? Is it private?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. ColorExtract processes pixels entirely in your browser using Canvas. Your image never leaves your device, is never stored in a database, and local cache can be cleared anytime."
      }
    },
    {
      "@type": "Question",
      "name": "Which image formats are supported? What is the size limit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "JPG, PNG, WEBP and SVG are supported, up to 20MB per image. Drag & drop, click to choose, or paste with Ctrl/⌘+V."
      }
    },
    {
      "@type": "Question",
      "name": "How many colors can I extract? What extraction modes are there?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Extract 5 to 10 colors at once with balanced, vivid, soft, bright or dark modes. Lock colors to keep them when re-extracting."
      }
    },
    {
      "@type": "Question",
      "name": "What export formats are available?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Copy HEX, RGB or HSL values, or export CSS variables, Tailwind config, JSON files, or download a PNG palette for design or development."
      }
    },
    {
      "@type": "Question",
      "name": "How do I check accessibility of my palette?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A built-in WCAG contrast checker tests foreground/background readability against AA and AAA. A colorblind simulator previews your palette under common color vision deficiencies."
      }
    }
  ]
}`

function makePageHtml(path, rendered) {
  // /en/ 前缀：去掉前缀查中文 meta，但用英文 title/desc 覆盖
  const isEn = path.startsWith('/en')
  const basePath = isEn ? path.replace(/^\/en(?=\/|$)/, '') || '/' : path
  let meta = PAGE_META[basePath]
  if (isEn) {
    const enMeta = EN_META[basePath]
    if (enMeta) meta = { ...meta, ...enMeta }
  }
  if (!meta) return rendered
  const bodyStart = rendered.indexOf('<body')
  const bodyEnd = rendered.indexOf('</body>')
  if (bodyStart < 0 || bodyEnd < 0) return rendered
  const body = rendered.slice(bodyStart, bodyEnd + '</body>'.length)
  // 从渲染后的 DOM 动态提取实际资源引用（hash 每次 build 会变）
  const cssRef = rendered.match(/<link rel="stylesheet"[^>]*>/)?.[0] ?? ''
  const jsRef = rendered.match(/<script type="module"[^>]*src="[^"]*"[^>]*>/)?.[0] ?? ''
  const htmlLang = isEn ? 'en' : 'zh-CN'
  return `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${meta.title}</title>
<meta name="description" content="${meta.desc}" />
<link rel="canonical" href="https://colorextract.cn${path}" />
<meta name="robots" content="index, follow" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${meta.title}" />
<meta property="og:description" content="${meta.desc}" />
<meta property="og:url" content="https://colorextract.cn${path}" />
<meta property="og:image" content="https://colorextract.cn/og.png" />
<meta property="og:site_name" content="ColorExtract" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${meta.title}" />
<meta name="twitter:description" content="${meta.desc}" />
<meta name="twitter:image" content="https://colorextract.cn/og.png" />
${cssRef}
${jsRef}
${path === '/en/' ? `<script type="application/ld+json">${EN_FAQ_LD}</script>` : ''}
</head>
${body}
</html>`
}
const server = await serve()
try {
  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route.path}`
    const rendered = await render(url)
    if (process.env.DEBUG_PRERENDER) {
      const snippet = rendered.slice(0, 200).replace(/\s+/g, ' ')
      console.error(`[DEBUG] ${route.path} -> ${rendered.length} chars, hasRoot=${rendered.includes('<div id="root">')}`)
      console.error(`[DEBUG] head: ${snippet}`)
    }
    // 首页：复用原始 index.html（保留 authored head），仅替换 root 内容
    // 功能页：makePageHtml 生成带独立 title/description 的完整 HTML
    let finalHtml
    if (route.path === '/') {
      const original = await readFile(join(ROOT, 'index.html'), 'utf-8')
      finalHtml = injectRendered(original, rendered)
    } else {
      finalHtml = makePageHtml(route.path, rendered)
    }
    await mkdir(join(ROOT, route.path.replace(/^\//, '')), { recursive: true })
    await writeFile(join(ROOT, route.out), finalHtml, 'utf-8')
    const chars = finalHtml.match(/<div id="root">([\s\S]*?)<\/body>/)?.[1] ?? ''
    const visible = chars.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length
    console.log(`prerendered ${route.path} -> ${route.out} (${visible} visible chars)`)
  }
} finally {
  server.close()
}
