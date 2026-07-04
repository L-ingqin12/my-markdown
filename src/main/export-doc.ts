import { BrowserWindow, dialog } from 'electron'
import { writeFile, readFile } from 'fs/promises'

/**
 * Export Markdown as a Word‑compatible .doc file.
 *
 * Strategy: generate a self‑contained HTML file with Word‑friendly
 * metadata and save it with a `.doc` extension.  Word (and LibreOffice)
 * can open such files natively, preserving styling, tables, images, etc.
 *
 * The exported HTML embeds the active theme's CSS variables so the
 * document looks consistent with the user's current theme.
 */

// ---------------------------------------------------------------------------
// Default CSS (used when theme CSS is unavailable)
// ---------------------------------------------------------------------------

const DEFAULT_EXPORT_CSS = `
body {
  max-width: 860px;
  margin: 0 auto;
  padding: 2em;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12pt;
  line-height: 1.7;
  color: #333;
}
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  margin: 1.2em 0 0.6em;
}
h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; color: #666; }
p { margin: 0 0 1em; }
a { color: #428bca; }
strong { font-weight: 600; }
em { font-style: italic; }
code {
  background: #f4f4f4;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Consolas', 'Fira Code', 'Courier New', monospace;
  font-size: 0.9em;
}
pre {
  background: #f4f4f4;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  border: 1px solid #ddd;
  margin: 0 0 1em;
}
pre code {
  background: none;
  padding: 0;
  border-radius: 0;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}
th { background: #f5f5f5; font-weight: 600; }
tr:nth-child(even) td { background: #fafafa; }
blockquote {
  border-left: 4px solid #42b983;
  margin: 0 0 1em;
  padding: 0.5em 1em;
  color: #666;
  background: #f8f8f8;
}
ul, ol { padding-left: 2em; margin: 0 0 1em; }
li { margin-bottom: 0.25em; }
img { max-width: 100%; height: auto; }
hr { border: none; border-top: 2px solid #ddd; margin: 1.5em 0; }
.page-break { page-break-before: always; }
@media print {
  @page { margin: 2cm; size: A4; }
  pre, code { page-break-inside: avoid; }
}
`

// ---------------------------------------------------------------------------
// Build the Word‑compatible HTML document
// ---------------------------------------------------------------------------

interface DocExportOptions {
  title?: string
  themeCss?: string
}

function buildDocHtml(bodyHtml: string, options: DocExportOptions): string {
  const title = options.title || 'Exported Document'
  const css = options.themeCss || DEFAULT_EXPORT_CSS

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="My Markdown">
<title>${title}</title>
<style>
/* Theme CSS variables are injected here */
${css}

/* Word-specific page setup */
@page {
  size: A4;
  margin: 2cm 2.5cm;
  mso-page-orientation: portrait;
}

body {
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12pt;
  line-height: 1.6;
  color: #333;
  max-width: 210mm;
  margin: 0 auto;
  padding: 0;
}

/* Ensure tables don't break across pages unnecessarily */
table {
  mso-table-layout-alt: fixed;
  border-collapse: collapse;
}

/* Prevent page breaks inside paragraphs, headings */
p, h1, h2, h3, h4, h5, h6 {
  mso-line-height-rule: exactly;
}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Export handler for Electron
// ---------------------------------------------------------------------------

/**
 * Export HTML content as a Word-compatible .doc file.
 *
 * @param bodyHtml    The rendered HTML body (from markdown conversion)
 * @param filePath    Optional explicit save path
 * @param options     Optional title and theme CSS
 * @returns           The saved file path, or null if cancelled
 */
export async function exportDoc(
  bodyHtml: string,
  filePath?: string,
  options: DocExportOptions = {},
): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const docHtml = buildDocHtml(bodyHtml, options)

  if (filePath) {
    await writeFile(filePath, docHtml, 'utf-8')
    return filePath
  }

  const result = await dialog.showSaveDialog(win, {
    title: 'Export as Word Document',
    filters: [
      { name: 'Word Document', extensions: ['doc'] },
      { name: 'HTML Files', extensions: ['html'] },
    ],
    defaultPath: options.title
      ? `${options.title.replace(/[<>:"/\\|?*]/g, '_')}.doc`
      : 'export.doc',
  })

  if (result.canceled || !result.filePath) return null
  await writeFile(result.filePath, docHtml, 'utf-8')
  return result.filePath
}

/**
 * Read a CSS file from disk and return its content, or undefined on failure.
 */
export async function loadCssFile(cssPath: string): Promise<string | undefined> {
  try {
    return await readFile(cssPath, 'utf-8')
  } catch {
    return undefined
  }
}
