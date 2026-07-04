import { BrowserWindow, dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { loadThemeCss, getCurrentTheme } from './theme-manager'

// ---------------------------------------------------------------------------
// CSS helpers – try to use the active theme, fall back to built‑in defaults
// ---------------------------------------------------------------------------

/** Default screen‑oriented CSS for HTML export */
const EXPORT_CSS = `
body { max-width: 860px; margin: 0 auto; padding: 2em; font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: 16px; line-height: 1.7; color: #333; }
pre { background: #f4f4f4; padding: 1em; border-radius: 4px; overflow-x: auto; }
code { font-family: 'Consolas', 'Fira Code', monospace; font-size: 14px; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f5f5f5; }
blockquote { border-left: 4px solid #42b983; margin: 0; padding: 0.5em 1em; color: #666; background: #f8f8f8; }
img { max-width: 100%; }
h1, h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
a { color: #428bca; }
@media print { @page { margin: 2cm; size: A4; } pre, code { page-break-inside: avoid; } }
`

/** Default print‑oriented CSS for PDF export */
const PDF_CSS = `
body { max-width: 210mm; margin: 0 auto; padding: 15mm; font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: 12pt; line-height: 1.6; color: #333; }
pre { background: #f4f4f4; padding: 0.8em; border-radius: 4px; overflow-x: auto; font-size: 10pt; }
code { font-family: 'Consolas', monospace; font-size: 10pt; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 10pt; }
th { background: #f5f5f5; }
blockquote { border-left: 3px solid #42b983; margin: 0.5em 0; padding: 0.3em 0.8em; color: #555; }
img { max-width: 100%; }
h1 { font-size: 24pt; border-bottom: 1px solid #eee; }
h2 { font-size: 18pt; border-bottom: 1px solid #eee; }
h3 { font-size: 14pt; }
`

/**
 * Build theme-aware CSS for export by merging the active theme's CSS variables
 * with the base export stylesheet.
 */
async function buildThemeAwareCss(baseCss: string): Promise<string> {
  try {
    const themeName = getCurrentTheme()
    const themeCss = await loadThemeCss(themeName)
    // Extract only the :root variable declarations from the theme
    const varMatch = themeCss.match(/:root\s*\{([^}]*)\}/)
    if (varMatch) {
      const rootVars = varMatch[1].trim()
      return `:root {\n${rootVars}\n}\n\n${baseCss}`
    }
    return baseCss
  } catch {
    return baseCss
  }
}

/**
 * Wrap body HTML in a complete document, optionally embedding theme CSS variables.
 */
function wrapHtml(body: string, css: string, title: string = 'Exported Markdown'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`
}

// ---------------------------------------------------------------------------
// HTML Export
// ---------------------------------------------------------------------------

export async function exportHtml(
  content: string,
  filePath?: string,
  themeAware: boolean = false,
): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const css = themeAware ? await buildThemeAwareCss(EXPORT_CSS) : EXPORT_CSS
  const html = wrapHtml(content, css)

  if (filePath) {
    await writeFile(filePath, html, 'utf-8')
    return filePath
  }

  const result = await dialog.showSaveDialog(win, {
    title: 'Export HTML',
    filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
    defaultPath: 'export.html',
  })

  if (result.canceled || !result.filePath) return null
  await writeFile(result.filePath, html, 'utf-8')
  return result.filePath
}

// ---------------------------------------------------------------------------
// PDF Export
// ---------------------------------------------------------------------------

export async function exportPdf(
  content: string,
  filePath?: string,
  themeAware: boolean = false,
): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const css = themeAware ? await buildThemeAwareCss(PDF_CSS) : PDF_CSS
  const htmlContent = wrapHtml(content, css, 'Markdown PDF Export')

  const savePath =
    filePath ||
    (await new Promise<string | null>((resolve) => {
      dialog
        .showSaveDialog(win, {
          title: 'Export PDF',
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
          defaultPath: 'export.pdf',
        })
        .then((r) => resolve(r.canceled ? null : r.filePath!))
    }))

  if (!savePath) return null

  const pdfWin = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: { sandbox: true },
  })

  await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

  const pdfData = await pdfWin.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    margins: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
  })

  await writeFile(savePath, pdfData)
  pdfWin.close()
  return savePath
}

// ---------------------------------------------------------------------------
// Theme-aware HTML helper (re-exported for DOC / Feishu consumers)
// ---------------------------------------------------------------------------

export { buildThemeAwareCss }
