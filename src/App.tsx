import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navbar, Footer, PrivacySection } from './components/Navbar'
import { Uploader } from './components/Uploader'
import { ImagePreview } from './components/ImagePreview'
import { PaletteBar } from './components/PaletteBar'
import { ColorCard } from './components/ColorCard'
import { ColorDetail } from './components/ColorDetail'
import { ExportPanel } from './components/ExportPanel'
import { AuxPanels, InspirationPanel, CvdPanel, ContrastPanel, PageShell } from './components/AuxPanels'
import { TutorialPage } from './components/TutorialPages'
import { Button, Card, Segmented, Toaster } from './components/ui'
import { useTheme } from './hooks/useTheme'
import { toast } from './hooks/useToast'
import { translate, type Lang } from './lib/i18n'
import { useRoute, navigate, featurePath } from './lib/route'
import { nanoid } from './lib/id'
import { saveState, loadState, clearState } from './lib/storage'
import {
  extractPalette,
  normalizeRatios,
  svgToPngBlob,
  COLOR_COUNTS,
  MODE_LABELS,
  type ExtractMode,
} from './lib/extract'
import type { Swatch } from './lib/color'
import { nameOfColor, resetNamePool, WHITE } from './lib/color'

const SAMPLE_URL = `${import.meta.env.BASE_URL}sample.svg`

interface ImageState {
  url: string
  name: string
  size: number
  width: number
  height: number
  blob: Blob | null
}

export default function App() {
  const route = useRoute()
  const [lang, setLang] = useState<Lang>(() => {
    // /en/ 路径强制英文；否则按存储值（默认中文）
    if (route.lang === 'en') return 'en'
    return (localStorage.getItem('palette-extractor:lang') as Lang) ?? 'zh'
  })
  const { dark, toggle } = useTheme()
  const t = useCallback((k: string) => translate(lang, k), [lang])

  /* 路由切换时同步语言：/en/ 路径 → 英文；否则 → 存储值 */
  useEffect(() => {
    if (route.lang === 'en') {
      setLang('en')
    } else {
      setLang((localStorage.getItem('palette-extractor:lang') as Lang) ?? 'zh')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.lang])

  /* 语言切换：/en/ 路径用 URL 驱动，点击时导航到对应语言 URL */
  const toggleLang = () => {
    const isEn = route.lang === 'en'
    const targetPath = isEn
      ? featurePath(route.name, 'zh')
      : featurePath(route.name, 'en')
    navigate(targetPath)
    // 非 /en/ 路径仍写存储（中文默认/用户偏好）
    if (!isEn) localStorage.setItem('palette-extractor:lang', 'en')
    else localStorage.setItem('palette-extractor:lang', 'zh')
  }

  const [image, setImage] = useState<ImageState | null>(null)
  const [swatches, setSwatches] = useState<Swatch[]>([])
  const [count, setCount] = useState(6)
  const [mode, setMode] = useState<ExtractMode>('balanced')
  const [seamless, setSeamless] = useState(true)
  const [showPoints, setShowPoints] = useState(false)
  const [samplePoints, setSamplePoints] = useState<
    { x: number; y: number; rgb: [number, number, number] }[]
  >([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Swatch | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const thumbRef = useRef<HTMLImageElement | null>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  /* ---------- 首屏恢复 ---------- */
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      setSwatches(saved.swatches)
      setCount(saved.count)
      setMode(saved.mode as ExtractMode)
      if (saved.imageDataUrl) {
        setImage({
          url: saved.imageDataUrl,
          name: saved.fileName ?? 'image',
          size: saved.fileSize ?? 0,
          width: saved.width ?? 0,
          height: saved.height ?? 0,
          blob: null,
        })
      }
      toast(t('restored'), 'info')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- 持久化 ---------- */
  useEffect(() => {
    if (!image && !swatches.length) return
    saveState({
      swatches,
      imageDataUrl: image?.url,
      fileName: image?.name,
      fileSize: image?.size,
      width: image?.width,
      height: image?.height,
      count,
      mode,
      savedAt: Date.now(),
    })
  }, [swatches, image, count, mode])

  useEffect(() => {
    // /en/ 路径不写入存储（避免污染中文默认），其余才持久化
    if (route.lang === 'en') {
      document.documentElement.lang = 'en'
      return
    }
    localStorage.setItem('palette-extractor:lang', lang)
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang, route.lang])

  /* ---------- 缩略图对象（PNG 导出用） ---------- */
  useEffect(() => {
    if (!image?.url) {
      thumbRef.current = null
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      thumbRef.current = img
    }
    img.src = image.url
  }, [image?.url])

  /* ---------- 提取主流程 ---------- */
  const runExtract = useCallback(
    async (blob: Blob, opts?: { count?: number; mode?: ExtractMode; locked?: Swatch[] }) => {
      setBusy(true)
      setError(null)
      try {
        const targetCount = opts?.count ?? count
        const result = await extractPalette({
          blob,
          count: targetCount,
          mode: opts?.mode ?? mode,
          locked: opts?.locked ?? swatches.filter((s) => s.locked),
        })
        if (result.distinct < 2) {
          setError(t('errFew'))
          return null
        }
        const list = result.swatches.slice(0, targetCount)
        normalizeRatios(list)
        setSwatches(list)
        setSamplePoints(result.samplePoints)
        return list
      } catch {
        setError(t('errExtract'))
        return null
      } finally {
        setBusy(false)
      }
    },
    [count, mode, swatches, t],
  )

  /** 统一的图片接入入口：校验 → 测量 → 提取 */
  const pickFile = useCallback(
    async (file: File) => {
      const ext = (file.name.split('.').pop() ?? '').toLowerCase()
      const mimeOk = /^image\/(jpeg|png|webp|svg\+xml)$/.test(file.type)
      if (!mimeOk && !['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
        setError(t('errFormat'))
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        setError(t('errSize'))
        return
      }

      const isSvg = /svg/.test(file.type) || ext === 'svg'
      let blob: Blob = file
      if (isSvg) {
        try {
          blob = await svgToPngBlob(file)
        } catch {
          setError(t('errDecode'))
          return
        }
      }

      setError(null)
      const url = URL.createObjectURL(blob)
      const probe = new Image()
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        probe.onload = () => resolve({ width: probe.naturalWidth, height: probe.naturalHeight })
        probe.onerror = () => resolve({ width: 0, height: 0 })
        probe.src = url
      })

      setImage({
        url,
        name: file.name,
        size: file.size,
        width: dims.width,
        height: dims.height,
        blob,
      })
      setMode('balanced')

      const list = await runExtract(blob, { locked: [], mode: 'balanced' })
      if (list) toast(t('paletteGenerated'), 'success')
    },
    [runExtract, t],
  )

  /* ---------- 示例图 ---------- */
  const loadSample = useCallback(async () => {
    try {
      const res = await fetch(SAMPLE_URL)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      setError(null)
      const pngBlob = await svgToPngBlob(new File([blob], 'sample.svg', { type: 'image/svg+xml' }))
      const url = URL.createObjectURL(pngBlob)
      setImage({ url, name: 'sample.svg', size: blob.size, width: 1200, height: 800, blob: pngBlob })
      const list = await runExtract(pngBlob, { locked: [], mode: 'balanced' })
      if (list) toast(t('paletteGenerated'), 'success')
    } catch {
      setError(t('errFetchUrl'))
    }
  }, [runExtract, t])

  /* ---------- 重新提取（保留锁定色） ---------- */
  const handleReExtract = useCallback(async () => {
    if (!image?.blob) return
    const list = await runExtract(image.blob)
    if (list) toast(t('paletteGenerated'), 'success')
  }, [image, runExtract, t])

  const handleReset = useCallback(() => {
    setSwatches([])
    setImage(null)
    setError(null)
    setSelected(null)
    setSamplePoints([])
    setCount(6)
    setMode('balanced')
    clearState()
  }, [])

  /* ---------- 数量 / 模式变化 ---------- */
  const changeCount = useCallback(
    async (c: number) => {
      setCount(c)
      if (!image?.blob) return
      const locked = swatches.filter((s) => s.locked)
      await runExtract(image.blob, { count: c, locked })
    },
    [image, runExtract, swatches],
  )

  const changeMode = useCallback(
    async (m: ExtractMode) => {
      setMode(m)
      if (!image?.blob) return
      const locked = swatches.filter((s) => s.locked)
      await runExtract(image.blob, { mode: m, locked })
    },
    [image, runExtract, swatches],
  )

  /* ---------- 色板操作 ---------- */
  const updateSwatch = useCallback((id: string, patch: Partial<Swatch>) => {
    setSwatches((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const toggleLock = useCallback(
    (id: string) => {
      setSwatches((prev) => prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)))
    },
    [],
  )

  const removeSwatch = useCallback((id: string) => {
    setSwatches((prev) => {
      const next = prev.filter((s) => s.id !== id)
      normalizeRatios(next)
      return next
    })
    setSelected((cur) => (cur?.id === id ? null : cur))
  }, [])

  const addSwatch = useCallback(() => {
    setSwatches((prev) => {
      if (prev.length >= 12) return prev
      const base = prev[prev.length - 1]?.rgb ?? WHITE
      const jitter = (v: number) => Math.max(0, Math.min(255, v + Math.round((Math.random() - 0.5) * 70)))
      const rgb = { r: jitter(base.r), g: jitter(base.g), b: jitter(base.b) }
      resetNamePool()
      prev.forEach((p) => p.name)
      const next = [
        ...prev,
        {
          id: nanoid(),
          rgb,
          count: Math.round(1000 / (prev.length + 1)),
          ratio: 0,
          name: nameOfColor(rgb, lang),
          locked: true,
          edited: true,
        },
      ]
      normalizeRatios(next)
      return next
    })
  }, [lang])

  /* ---------- 拖拽排序 ---------- */
  const onDragStart = useCallback((idx: number) => setDragIdx(idx), [])
  const onDragEnter = useCallback(
    (idx: number) => {
      if (dragIdx === null || dragIdx === idx) return
      setSwatches((prev) => {
        const next = [...prev]
        const [moved] = next.splice(dragIdx, 1)
        next.splice(idx, 0, moved)
        return next
      })
      setDragIdx(idx)
    },
    [dragIdx],
  )
  const onDragEnd = useCallback(() => setDragIdx(null), [])

  const sortByRatio = useCallback(() => {
    setSwatches((prev) => [...prev].sort((a, b) => b.ratio - a.ratio))
  }, [])

  /* ---------- 导出 / 复制（由 ExportPanel 处理） ---------- */

  const countOptions = useMemo(
    () => COLOR_COUNTS.map((c) => ({ value: c, label: String(c) })),
    [],
  )
  const modeOptions = useMemo(
    () =>
      (Object.keys(MODE_LABELS) as ExtractMode[]).map((m) => ({
        value: m,
        label: MODE_LABELS[m][lang],
      })),
    [lang],
  )

  const hasResult = swatches.length > 0

  /* 非首页路由：渲染独立功能页 */
  if (route.name !== 'home') {
    return (
      <div id="top" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Navbar
          t={t}
          lang={lang}
          dark={dark}
          onToggleTheme={toggle}
          onToggleLang={toggleLang}
        />
        <main className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
          {route.name === 'generator' && (
            <PageShell title={t('pageGeneratorTitle')} desc={t('pageGeneratorDesc')}>
              <div className="space-y-5">
                <p className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-sm leading-relaxed text-[var(--text-sub)]">
                  {t('pageGeneratorBody')}
                </p>
                {swatches.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-sub)]">
                    {t('emptyState')}
                  </p>
                ) : (
                  <InspirationPanel t={t} lang={lang} swatches={swatches} />
                )}
                <a
                  href="/"
                  className="inline-block text-sm text-[#6C5CE7] hover:underline"
                >
                  {t('pageBackHome')}
                </a>
              </div>
            </PageShell>
          )}
          {route.name === 'colorblind' && (
            <PageShell title={t('pageColorblindTitle')} desc={t('pageColorblindDesc')}>
              <div className="space-y-5">
                <p className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-sm leading-relaxed text-[var(--text-sub)]">
                  {t('pageColorblindBody')}
                </p>
                {swatches.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-sub)]">
                    {t('emptyState')}
                  </p>
                ) : (
                  <CvdPanel t={t} lang={lang} swatches={swatches} />
                )}
                <a
                  href="/"
                  className="inline-block text-sm text-[#6C5CE7] hover:underline"
                >
                  {t('pageBackHome')}
                </a>
              </div>
            </PageShell>
          )}
          {route.name === 'contrast' && (
            <PageShell title={t('pageContrastTitle')} desc={t('pageContrastDesc')}>
              <div className="space-y-5">
                <p className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-sm leading-relaxed text-[var(--text-sub)]">
                  {t('pageContrastBody')}
                </p>
                <ContrastPanel t={t} lang={lang} />
                <a
                  href="/"
                  className="inline-block text-sm text-[#6C5CE7] hover:underline"
                >
                  {t('pageBackHome')}
                </a>
              </div>
            </PageShell>
          )}
          {route.name === 'tutorial-extract' && (
            <TutorialPage name="tutorial-extract" lang={lang} />
          )}
          {route.name === 'tutorial-guide' && (
            <TutorialPage name="tutorial-guide" lang={lang} />
          )}
        </main>
        <Footer t={t} />
        <Toaster />
      </div>
    )
  }

  return (
    <div id="top" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar
        t={t}
        lang={lang}
        dark={dark}
        onToggleTheme={toggle}
        onToggleLang={toggleLang}
      />

      <main className="mx-auto max-w-[1200px] px-4 pt-10 pb-8 sm:px-6">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1 text-xs font-medium text-[var(--text-sub)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
            {t('privacyNote')}
          </span>
          <h1 className="mt-5 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-sub)] sm:text-lg">
            {t('heroSub')}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => heroInputRef.current?.click()}>
              {t('ctaUpload')}
            </Button>
            <Button variant="secondary" size="lg" onClick={loadSample}>
              {t('ctaSample')}
            </Button>
          </div>
        </section>

        {/* 上传区 / 结果区 */}
        <section className="mt-10">
          {!image ? (
            <Card className="animate-fade-up p-4 sm:p-6">
              <Uploader t={t} onPick={(f) => void pickFile(f)} error={error} />
              <div className="mt-4 text-center">
                <p className="text-sm text-[var(--text-sub)]">{t('emptyState')}</p>
                <p className="mt-1 text-xs text-[var(--text-sub)] opacity-70">{t('emptySub')}</p>
              </div>
            </Card>
          ) : (
            <>
              {/* 工具栏 */}
              <div className="animate-fade-up mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-sub)]">{t('colorCount')}</span>
                  <Segmented options={countOptions} value={count} onChange={changeCount} label={t('colorCount')} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-sub)]">{t('mode')}</span>
                  <Segmented options={modeOptions} value={mode} onChange={changeMode} label={t('mode')} size="sm" />
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleReExtract} disabled={busy}>
                    ⟳ {busy ? t('extracting') : t('reExtract')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    {t('reset')}
                  </Button>
                  {hasResult && (
                    <ExportPanel
                      swatches={swatches}
                      sourceName={image.name}
                      thumb={thumbRef.current}
                      t={t}
                      lang={lang}
                    />
                  )}
                </div>
              </div>

              {/* 左右两栏 */}
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                {/* 左：图片 */}
                <div className="animate-fade-up space-y-3">
                  <ImagePreview src={image.url} points={samplePoints} showPoints={showPoints} lang={lang} />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-sub)]">
                    <span className="max-w-[180px] truncate font-medium text-[var(--text)]">{image.name}</span>
                    {image.width > 0 && (
                      <span>
                        {image.width}×{image.height} {t('px')}
                      </span>
                    )}
                    <span>{(image.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => replaceInputRef.current?.click()}>
                      {t('reupload')}
                    </Button>
                    <input
                      ref={replaceInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void pickFile(f)
                        e.target.value = ''
                      }}
                    />
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      {t('remove')}
                    </Button>
                    <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-[var(--text-sub)]">
                      <input
                        type="checkbox"
                        checked={showPoints}
                        onChange={(e) => setShowPoints(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[#6C5CE7]"
                      />
                      {t('showSamplePoints')}
                    </label>
                  </div>
                </div>

                {/* 右：色板 */}
                <div className="animate-fade-up space-y-3">
                  <PaletteBar
                    swatches={swatches}
                    seamless={seamless}
                    onSelect={setSelected}
                    t={t}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Segmented
                      size="sm"
                      value={seamless ? 'seamless' : 'gap'}
                      onChange={(v) => setSeamless(v === 'seamless')}
                      options={[
                        { value: 'seamless', label: t('seamless') },
                        { value: 'gap', label: t('gap') },
                      ]}
                      label="palette display"
                    />
                    <Button variant="ghost" size="sm" onClick={sortByRatio}>
                      {t('sortByRatio')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 颜色卡片 */}
              {hasResult ? (
                <div className="mt-8">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{t('palette')}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-sub)]">{t('dragHint')}</span>
                      <Button variant="secondary" size="sm" onClick={addSwatch}>
                        ＋ {t('addColor')}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {swatches.map((s, i) => (
                      <ColorCard
                        key={s.id}
                        swatch={s}
                        index={i}
                        t={t}
                        lang={lang}
                        dragging={dragIdx === i}
                        onDragStart={() => onDragStart(i)}
                        onDragEnter={() => onDragEnter(i)}
                        onDragEnd={onDragEnd}
                        onOpen={() => setSelected(s)}
                        onToggleLock={() => toggleLock(s.id)}
                        onDelete={() => removeSwatch(s.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="mt-8 p-8 text-center">
                  <p className="text-sm text-[var(--text-sub)]">{t('emptyState')}</p>
                </Card>
              )}
            </>
          )}
        </section>

        {/* 辅助面板 */}
        <div className="mt-12">
          <nav aria-label="Tools" className="mb-4 grid gap-3 sm:grid-cols-3">
            <a href={featurePath('generator', lang)} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 transition-colors hover:border-[#6C5CE7]/50">
              <p className="text-sm font-semibold">{t('pageGeneratorTitle')}</p>
              <p className="mt-1 text-xs text-[var(--text-sub)]">{t('pageGeneratorDesc')}</p>
            </a>
            <a href={featurePath('colorblind', lang)} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 transition-colors hover:border-[#6C5CE7]/50">
              <p className="text-sm font-semibold">{t('pageColorblindTitle')}</p>
              <p className="mt-1 text-xs text-[var(--text-sub)]">{t('pageColorblindDesc')}</p>
            </a>
            <a href={featurePath('contrast', lang)} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 transition-colors hover:border-[#6C5CE7]/50">
              <p className="text-sm font-semibold">{t('pageContrastTitle')}</p>
              <p className="mt-1 text-xs text-[var(--text-sub)]">{t('pageContrastDesc')}</p>
            </a>
          </nav>
          <AuxPanels t={t} lang={lang} swatches={swatches} />
        </div>

        {/* 说明 / 隐私 */}
        <div className="mt-12">
          <PrivacySection t={t} onClear={clearState} ButtonRef={Button} />
        </div>
      </main>

      <Footer t={t} />

      {/* 详情抽屉 */}
      {selected && (
        <ColorDetail
          swatch={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          t={t}
          lang={lang}
          isMobile={false}
          onChangeColor={(rgb) => updateSwatch(selected.id, { rgb, edited: true })}
          onChangeName={(name) => updateSwatch(selected.id, { name })}
          onToggleLock={() => toggleLock(selected.id)}
          onDelete={() => removeSwatch(selected.id)}
        />
      )}

      {/* 移动端固定导出条 */}
      {hasResult && image && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg-elev)]/95 p-3 backdrop-blur-xl sm:hidden">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {swatches.slice(0, 5).map((s) => (
                <span
                  key={s.id}
                  className="h-8 flex-1 rounded-md border border-black/10"
                  style={{ background: `rgb(${s.rgb.r}, ${s.rgb.g}, ${s.rgb.b})` }}
                />
              ))}
            </div>
            <ExportPanel
              swatches={swatches}
              sourceName={image.name}
              thumb={thumbRef.current}
              t={t}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* Hero 上传入口 */}
      <input
        ref={heroInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void pickFile(f)
          e.target.value = ''
        }}
      />

      <Toaster />
    </div>
  )
}

