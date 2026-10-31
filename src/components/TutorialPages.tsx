import type { Lang } from '../lib/i18n'

/** 教程页内容：纯 SEO 内容页，双语，正文足。 */
type TutorialContent = {
  title: string
  desc: string
  h2: string[]
  p: string[]
  list: string[]
}

const EXTRACT_ZH: TutorialContent = {
  title: '如何从图片提取配色：完整图文教程（2026）',
  desc: '从任意图片中提取专业配色方案，支持 5-10 色、多种提取模式，导出 HEX/RGB/HSL、CSS 变量、PNG 和 JSON。全程本地处理，不上传图片。',
  h2: [
    '为什么要从图片提取配色？',
    '提取配色的三种核心方法',
    '用 ColorExtract 提取配色的详细步骤',
    '如何选择提取模式',
    '提取后的颜色怎么用',
    '常见问题与技巧',
  ],
  p: [
    '一张好照片里往往藏着最和谐的色彩组合。从图片提取配色，能让你的设计、网页、海报直接复用真实世界里的色彩关系，避免凭空配色造成的刺眼或单调。这是设计师和前端开发者最常用的起步方法，也是建立品牌配色体系的可靠来源。',
    '传统上，设计师会用吸管工具手动取色，或者用 Adobe Color 之类的工具。但手动取色速度慢、容易漏掉关键色，而且不同屏幕色差会让取色不准。自动提取算法能在几秒内分析整张图片的像素分布，找出占据主导地位的颜色，比肉眼判断更客观。',
    'ColorExtract 的提取基于像素聚类算法：先把图片缩放到合理尺寸，读取每个像素的 RGB 值，然后聚类出占比最高的几个颜色。你不需要懂算法，上传图片即可得到结果。',
    '首先打开 ColorExtract 首页，把图片拖拽到上传区域，或者点击选择文件，也可以直接用 Ctrl/⌘+V 粘贴剪贴板里的截图。支持 JPG、PNG、WEBP、SVG，单张最大 20MB。',
    '图片加载后，选择你想提取的颜色数量（5 到 10 种）和提取模式。页面会实时生成色板，每张颜色卡片显示 HEX、RGB、HSL 值。点击任意颜色即可复制对应格式。',
    '提取完成后，你可以点击颜色卡片打开详情，查看颜色名称、色阶预览和 WCAG 对比度检测结果。也可以用色板下方的导出按钮，一键复制 CSS 变量、Tailwind 配置或导出 JSON 文件、下载 PNG 色板图。',
    '均衡模式适合大多数照片，会平衡分布主色和辅助色；鲜艳模式会偏向饱和度高的颜色，适合做海报主色；柔和模式适合营造温和氛围；明亮模式和暗调模式分别适合浅色和深色背景的设计。',
    '锁定功能非常实用：重新提取时，锁定的颜色会被保留，这样你可以在保持主色调不变的前提下，微调辅助色。',
    '提取出的颜色可以直接用于网页 CSS、设计稿、品牌 VI 或数据可视化配色。配合内置的 WCAG 对比度检测器，还能快速检查文字和背景的对比度是否达到可读性标准。',
    '如果图片颜色太单一，提取结果会提示颜色不够丰富，建议换一张细节更多的图片。配色方案可以随时导出为 JSON 文件存档，方便跨项目复用。',
  ],
  list: [
    '用吸管工具手动取色（慢，易漏色）',
    '用在线取色工具自动分析（快，客观）',
    '用浏览器开发者工具读 CSS 色值（针对已有网站）',
  ],
}

const EXTRACT_EN: TutorialContent = {
  title: 'How to Extract Colors from an Image: Complete Tutorial (2026)',
  desc: 'Extract a professional color palette from any image. 5-10 colors, multiple modes, export HEX/RGB/HSL, CSS variables, PNG and JSON. 100% local, nothing uploaded.',
  h2: [
    'Why extract colors from an image?',
    'Three core methods for extracting a palette',
    'Step-by-step extraction with ColorExtract',
    'How to choose an extraction mode',
    'What to do with the extracted colors',
    'Tips and troubleshooting',
  ],
  p: [
    'A great photo often hides the most harmonious color combinations. Extracting colors from an image lets your design, website or poster reuse the real color relationships found in nature — avoiding the harsh or flat results of picking colors blindly. It is the starting point most designers and front-end developers rely on.',
    'Traditionally, designers picked colors manually with an eyedropper or tools like Adobe Color. But manual picking is slow, easy to miss key shades, and screen differences make it inaccurate. Automatic extraction analyzes the whole image in seconds and finds the dominant colors objectively.',
    'ColorExtract uses pixel clustering: it scales the image, reads each pixel RGB value, and clusters the most prominent colors. You do not need to understand the algorithm — just upload an image and get results.',
    'Open the ColorExtract home page, drag an image into the upload area, click to choose a file, or paste a screenshot with Ctrl/⌘+V. JPG, PNG, WEBP and SVG are supported up to 20MB.',
    'After the image loads, pick how many colors to extract (5 to 10) and a mode. The palette generates in real time — each card shows HEX, RGB and HSL. Click any color to copy.',
    'Once extracted, click a color card for details: color name, shade preview and WCAG contrast checks. Use the export panel to copy CSS variables, Tailwind config, export JSON, or download a PNG palette.',
    'Balanced mode suits most photos and balances primary and secondary colors. Vivid mode leans toward saturated colors, great for poster headlines. Soft mode creates a calm feel, while Bright and Dark modes suit light and dark designs.',
    'The lock feature is handy: locked colors are kept when re-extracting, so you can fine-tune accent colors without losing your base tones.',
    'Use extracted colors for web CSS, design mockups, brand identity or data visualization. Pair with the built-in WCAG contrast checker to verify text readability.',
    'If an image is too flat, the tool warns there are not enough distinct colors — try a more detailed image. Palettes can be exported as JSON for reuse across projects.',
  ],
  list: [
    'Manual eyedropper picking (slow, misses shades)',
    'Online automatic extraction (fast, objective)',
    'Read CSS values in browser DevTools (for existing sites)',
  ],
}

const GUIDE_ZH: TutorialContent = {
  title: '配色方案指南：互补、类似、三色与如何应用（2026）',
  desc: '系统了解常用配色方案——互补色、类似色、三等分色、分裂互补色、单色系，以及如何在网页和品牌设计中正确应用，搭配 WCAG 对比度检查。',
  h2: [
    '什么是配色方案？',
    '五种经典配色方案详解',
    '如何选择和搭配主色',
    '配色在网页设计中的应用',
    '无障碍配色：对比度与色盲',
    '配色的常见误区',
  ],
  p: [
    '配色方案是设计里预先设定的颜色组合规则，用来保证整体视觉和谐统一。好的配色不是"好看"那么简单，它传递情绪、建立层级、引导视线。理解配色方案，是每个设计师和前端开发者的基本功。',
    '互补色是色轮上相对的两个颜色（如蓝和橙），对比强烈，适合突出重点；类似色是色轮上相邻的几个颜色（如蓝、蓝绿、绿），和谐柔和，适合大面积背景。',
    '三等分色是色轮上等距的三个颜色，活泼且平衡，适合需要多个色彩的场景；分裂互补色是互补色两侧的邻近色组合，比纯互补更柔和；单色系只用同一个色相的不同明暗，是最安全的配色，适合极简和高级感。',
    '主色决定整体基调，建议选一个占主导的色相。辅助色用于次要元素，强调色用于最重要的操作按钮或链接。一个常用原则是 60-30-10：60% 主色、30% 辅助色、10% 强调色。',
    '在网页设计中，主色用于导航、标题和按钮，辅助色用于背景块和卡片，强调色用于悬停、激活和 CTA。使用色板生成器可以快速从一张品牌图片提取整套方案，保证一致性。',
    '配色必须考虑可读性：文字和背景的对比度要满足 WCAG AA（普通文本 4.5:1，大文本 3:1）。同时要考虑色盲用户，红绿、蓝黄等常见色觉缺陷会改变感知，用色盲模拟器提前检查很重要。',
    '常见误区包括：用太多颜色导致杂乱、对比度过低导致文字难读、只看屏幕不看打印效果、忽略色盲用户。用 60-30-10 原则控制颜色数量，用对比度检测器把关可读性，能避免大部分问题。',
  ],
  list: [
    '互补色：色轮相对，强烈对比，突出重点',
    '类似色：相邻色，和谐柔和，适合背景',
    '三等分色：等距三色，活泼平衡',
    '分裂互补色：互补两侧，比纯互补柔和',
    '单色系：同色相不同明暗，极简高级',
  ],
}

const GUIDE_EN: TutorialContent = {
  title: 'Color Scheme Guide: Complementary, Analogous, Triadic & How to Apply (2026)',
  desc: 'A systematic guide to color schemes — complementary, analogous, triadic, split-complementary and monochromatic — with application tips for web and brand design, plus WCAG contrast checks.',
  h2: [
    'What is a color scheme?',
    'Five classic color schemes explained',
    'How to choose and combine a primary color',
    'Applying color schemes in web design',
    'Accessible color: contrast and color blindness',
    'Common color mistakes to avoid',
  ],
  p: [
    'A color scheme is a predefined set of color relationships that keeps a design visually harmonious. Good color is not just "pretty" — it conveys mood, establishes hierarchy and guides the eye. Understanding color schemes is foundational for designers and front-end developers.',
    'Complementary colors sit opposite on the color wheel (like blue and orange) and create strong contrast for emphasis. Analogous colors are neighbors (like blue, blue-green, green) — harmonious and soft, great for large backgrounds.',
    'Triadic colors are three evenly spaced on the wheel — lively and balanced for multi-color scenes. Split-complementary uses the two neighbors of the complement — softer than pure complementary. Monochromatic uses one hue at different shades — the safest choice for minimal or premium looks.',
    'The primary color sets the overall tone; pick one dominant hue. Secondary colors support minor elements, while an accent color marks the most important buttons or links. A common rule is 60-30-10: 60% primary, 30% secondary, 10% accent.',
    'In web design, use the primary for navigation, headings and buttons, secondary for background blocks and cards, and accent for hover, active and CTA states. A palette generator can quickly extract a full scheme from a brand image for consistency.',
    'Always consider readability: text-to-background contrast must meet WCAG AA (4.5:1 for normal, 3:1 for large text). Also account for color blindness — red/green and blue/yellow deficiencies change perception, so check with a simulator beforehand.',
    'Common mistakes include too many colors creating clutter, too-low contrast hurting readability, designing only for screens and ignoring print, and neglecting color-blind users. Control the count with the 60-30-10 rule and gate readability with a contrast checker.',
  ],
  list: [
    'Complementary: opposite on the wheel, strong contrast, emphasis',
    'Analogous: neighbors, harmonious and soft, for backgrounds',
    'Triadic: three evenly spaced, lively and balanced',
    'Split-complementary: complement\'s neighbors, softer than pure',
    'Monochromatic: one hue, many shades, minimal and premium',
  ],
}

const CONTENT: Record<string, { zh: TutorialContent; en: TutorialContent }> = {
  'tutorial-extract': { zh: EXTRACT_ZH, en: EXTRACT_EN },
  'tutorial-guide': { zh: GUIDE_ZH, en: GUIDE_EN },
}

export function TutorialPage({ name, lang }: { name: string; lang: Lang }) {
  const c = CONTENT[name]
  if (!c) return null
  const d = lang === 'en' ? c.en : c.zh
  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 pb-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{d.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-sub)] sm:text-base">{d.desc}</p>
      </header>

      <div className="space-y-8">
        {d.h2.map((h, i) => (
          <section key={h}>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">{h}</h2>
            <p className="text-sm leading-relaxed text-[var(--text-sub)]">{d.p[i]}</p>
            {i === 1 && (
              <ul className="mt-3 space-y-2">
                {d.list.map((li) => (
                  <li key={li} className="flex gap-2 text-sm leading-relaxed text-[var(--text-sub)]">
                    <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C5CE7]" />
                    {li}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}
