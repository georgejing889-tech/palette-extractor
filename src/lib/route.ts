import { useEffect, useState } from 'react'
import type { Lang } from './i18n'

export type RouteName = 'home' | 'generator' | 'colorblind' | 'contrast' | 'tutorial-extract' | 'tutorial-guide'

export type Route = {
  name: RouteName
  /** URL 前缀 /en/ 时强制英文；否则按存储值。 */
  lang: Lang | null
}

/** 把当前 pathname 解析为路由。未知路径回退到 home。 */
export function parseRoute(pathname: string): Route {
  const p = pathname.replace(/\/+$/, '')
  // /en/ 前缀 → 英文路由，去掉前缀再匹配功能页
  if (p === '/en' || p.startsWith('/en/')) {
    const rest = p.replace(/^\/en(?=\/|$)/, '') || '/'
    const base = parseBase(rest)
    return { ...base, lang: 'en' }
  }
  return { ...parseBase(p), lang: null }
}

function parseBase(p: string): Route {
  if (p === '/palette-generator') return { name: 'generator', lang: null }
  if (p === '/colorblind-simulator') return { name: 'colorblind', lang: null }
  if (p === '/contrast-checker') return { name: 'contrast', lang: null }
  if (p === '/how-to-extract-color-from-image') return { name: 'tutorial-extract', lang: null }
  if (p === '/color-palette-guide') return { name: 'tutorial-guide', lang: null }
  return { name: 'home', lang: null }
}

/** 轻量路由：监听 popstate，返回当前路由。不引入 react-router。 */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
  }, [])
  return route
}

/** 客户端导航：更新 URL 并触发路由更新。 */
export function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}

/** 功能页路径（含 /en/ 前缀时返回英文版路径）。 */
export function featurePath(name: RouteName, lang: Lang): string {
  const base = name === 'home' ? '/' : `/${name}`
  return lang === 'en' ? `/en${base === '/' ? '/' : base}` : base
}
