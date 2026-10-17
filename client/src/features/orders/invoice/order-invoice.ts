import shabnamRegular from '#/assets/Font/Shabnam.woff2?url'
import shabnamBold from '#/assets/Font/Shabnam-Bold.woff2?url'
import type { Order, OrderMeasurement } from '../slice/orders-types'
import { orderCode } from '../components/orders-column'

/**
 * Invoices are built as a standalone HTML page rendered into a hidden iframe,
 * not drawn with a PDF library's own text API: the browser already shapes
 * Persian and lays out RTL correctly, which jsPDF on its own does not. Print
 * prints that iframe; download rasterises it onto an A4 PDF.
 */

export interface InvoiceOptions {
  /** `i18n.t` — every label on the page goes through it. */
  t: (key: string) => string
  /** `i18n.language`, used for both number and date formatting. */
  language: string
  dir: 'ltr' | 'rtl'
}

/** A4 at 96dpi — the iframe is this wide so the PDF needs no rescaling. */
const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

type MeasurementKey = keyof Omit<
  OrderMeasurement,
  'id' | 'name' | 'created_at' | 'updated_at'
>

const measurementColumns: Array<{ key: MeasurementKey; label: string }> = [
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'chest', label: 'Chest' },
  { key: 'collar', label: 'Collar' },
  { key: 'sleeve_length', label: 'Sleeve' },
  { key: 'cuff', label: 'Cuff' },
  { key: 'length', label: 'Length' },
  { key: 'pants_length', label: 'Pants' },
  { key: 'hem', label: 'Hem' },
]

/** Customer-entered text goes straight into markup, so it is escaped. */
const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** `YYYY-MM-DD` read as a local date — see the note in `orders-column`. */
const formatDateOnly = (value: string, language: string) => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return '—'

  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
    new Date(year, month - 1, day),
  )
}

const formatAmount = (value: number | string, language: string) => {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(language).format(amount)
    : String(value)
}

export const invoiceFileName = (order: Order) =>
  `invoice-${orderCode(order.id)}.pdf`

export const buildInvoiceHtml = (
  order: Order,
  { t, language, dir }: InvoiceOptions,
) => {
  const customerName = [order.customer.name, order.customer.last_name]
    .filter(Boolean)
    .join(' ')
  const total = order.quantity * Number(order.price)
  const issued = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
  }).format(new Date())

  const description = [
    `${t('Collar type')}: ${order.collar_type}`,
    `${t('Pants type')}: ${order.pants_type}`,
    `${t('Sleeve type')}: ${order.sleeve_type}`,
    `${t('Chest pocket')}: ${order.chest_pocket ? t('Yes') : t('No')}`,
  ]
    .map(escapeHtml)
    .join(' · ')

  const measurementHead = measurementColumns
    .map(({ label }) => `<th>${escapeHtml(t(label))}</th>`)
    .join('')
  const measurementBody = measurementColumns
    .map(
      ({ key }) =>
        `<td class="num">${escapeHtml(order.measurement[key] ?? '—')}</td>`,
    )
    .join('')

  return `<!doctype html>
<html lang="${escapeHtml(language)}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(`${t('Invoice')} ${orderCode(order.id)}`)}</title>
<style>
  @font-face { font-family: Shabnam; src: url('${shabnamRegular}') format('woff2'); font-weight: 400; }
  @font-face { font-family: Shabnam; src: url('${shabnamBold}') format('woff2'); font-weight: 700; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; }
  body {
    width: ${PAGE_WIDTH}px;
    min-height: ${PAGE_HEIGHT}px;
    padding: 56px 56px 48px;
    font-family: Shabnam, Inter, system-ui, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #1f2937;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 { margin: 0; font-size: 28px; font-weight: 700; color: #111827; }
  h2 { margin: 0 0 8px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #6b7280; }
  .muted { color: #6b7280; }
  .num { font-variant-numeric: tabular-nums; }
  .ltr { direction: ltr; unicode-bidi: isolate; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #111827; }
  .meta { display: grid; grid-template-columns: auto auto; column-gap: 16px; row-gap: 2px; text-align: start; }
  .meta dt { color: #6b7280; }
  .meta dd { margin: 0; font-weight: 700; }
  .badge { display: inline-block; padding: 1px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .badge.pending { background: #fef3c7; color: #92400e; }
  .badge.done { background: #dcfce7; color: #166534; }
  .parties { display: flex; justify-content: space-between; gap: 32px; margin: 28px 0; }
  .parties p { margin: 0; }
  .name { font-size: 15px; font-weight: 700; color: #111827; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 10px 12px; font-size: 11px; font-weight: 700; text-align: start; color: #374151; background: #f3f4f6; }
  td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .items th:not(:first-child), .items td:not(:first-child) { text-align: end; white-space: nowrap; }
  .totals { width: 280px; margin-inline-start: auto; margin-top: 16px; }
  .totals td { border: 0; padding: 6px 12px; }
  .totals td:last-child { text-align: end; }
  .totals .grand td { border-top: 2px solid #111827; padding-top: 10px; font-size: 16px; font-weight: 700; color: #111827; }
  .measurements { margin-top: 40px; }
  .measurements th, .measurements td { text-align: center; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(t('Invoice'))}</h1>
      <div class="muted ltr">${escapeHtml(orderCode(order.id))}</div>
    </div>
    <dl class="meta" style="margin:0">
      <dt>${escapeHtml(t('Issue date'))}</dt><dd>${escapeHtml(issued)}</dd>
      <dt>${escapeHtml(t('Status'))}</dt>
      <dd><span class="badge ${order.status}">${escapeHtml(t(order.status === 'done' ? 'Done' : 'Pending'))}</span></dd>
    </dl>
  </div>

  <div class="parties">
    <div>
      <h2>${escapeHtml(t('Bill to'))}</h2>
      <p class="name">${escapeHtml(customerName)}</p>
      <p class="ltr" style="display:inline-block">${escapeHtml(order.customer.phone)}</p>
    </div>
    <dl class="meta" style="margin:0">
      <dt>${escapeHtml(t('Start'))}</dt><dd>${escapeHtml(formatDateOnly(order.start_date, language))}</dd>
      <dt>${escapeHtml(t('Due'))}</dt><dd>${escapeHtml(formatDateOnly(order.end_date, language))}</dd>
    </dl>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>${escapeHtml(t('Description'))}</th>
        <th>${escapeHtml(t('Quantity'))}</th>
        <th>${escapeHtml(t('Price'))}</th>
        <th>${escapeHtml(t('Total'))}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div style="font-weight:700;color:#111827">${escapeHtml(t('Tailoring'))}</div>
          <div class="muted" style="font-size:12px">${description}</div>
        </td>
        <td class="num">${escapeHtml(formatAmount(order.quantity, language))}</td>
        <td class="num">${escapeHtml(formatAmount(order.price, language))}</td>
        <td class="num">${escapeHtml(formatAmount(total, language))}</td>
      </tr>
    </tbody>
  </table>

  <table class="totals">
    <tr><td class="muted">${escapeHtml(t('Subtotal'))}</td><td class="num">${escapeHtml(formatAmount(total, language))}</td></tr>
    <tr class="grand"><td>${escapeHtml(t('Total'))}</td><td class="num">${escapeHtml(formatAmount(total, language))}</td></tr>
  </table>

  <div class="measurements">
    <h2>${escapeHtml(t('Measurement'))}${order.measurement.name ? ` — ${escapeHtml(order.measurement.name)}` : ''}</h2>
    <table>
      <thead><tr>${measurementHead}</tr></thead>
      <tbody><tr>${measurementBody}</tr></tbody>
    </table>
  </div>

  <div class="footer">${escapeHtml(t('Thank you for your order.'))}</div>
</body>
</html>`
}

/**
 * Mounts the invoice in an off-screen iframe and resolves once its fonts
 * have loaded — printing or capturing before then falls back to the system
 * font and loses the Persian glyphs' proper shapes.
 */
const mountInvoiceFrame = async (html: string) => {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  Object.assign(frame.style, {
    position: 'fixed',
    top: '0',
    left: `-${PAGE_WIDTH * 2}px`,
    width: `${PAGE_WIDTH}px`,
    height: `${PAGE_HEIGHT}px`,
    border: '0',
  })
  document.body.appendChild(frame)

  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    throw new Error('Could not create the invoice frame.')
  }

  doc.open()
  doc.write(html)
  doc.close()
  await doc.fonts.ready

  return frame
}

export const printOrderInvoice = async (
  order: Order,
  options: InvoiceOptions,
) => {
  const frame = await mountInvoiceFrame(buildInvoiceHtml(order, options))
  const view = frame.contentWindow
  if (!view) {
    frame.remove()
    throw new Error('Could not open the print dialog.')
  }

  // `print()` blocks in most browsers but returns at once in some, so the
  // frame is torn down on `afterprint`, with a timeout as a backstop.
  const cleanup = () => frame.remove()
  view.addEventListener('afterprint', cleanup, { once: true })
  setTimeout(cleanup, 60_000)

  view.focus()
  view.print()
}

export const downloadOrderInvoice = async (
  order: Order,
  options: InvoiceOptions,
) => {
  // Loaded on demand: together they are a few hundred kB nobody needs until
  // the first download.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])

  const frame = await mountInvoiceFrame(buildInvoiceHtml(order, options))
  try {
    const body = frame.contentDocument!.body
    const canvas = await html2canvas(body, {
      scale: 2,
      backgroundColor: '#ffffff',
      width: PAGE_WIDTH,
      windowWidth: PAGE_WIDTH,
    })

    const pdf = new jsPDF({
      unit: 'px',
      format: 'a4',
      hotfixes: ['px_scaling'],
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imageHeight = (canvas.height * pageWidth) / canvas.width
    const image = canvas.toDataURL('image/jpeg', 0.95)

    // One order is one page in practice; the loop only matters if a long
    // name or measurement label pushes it past A4. The slack keeps rounding
    // between CSS px and the PDF's page size from adding a blank page.
    for (let offset = 0; offset < imageHeight - 4; offset += pageHeight) {
      if (offset > 0) pdf.addPage()
      pdf.addImage(image, 'JPEG', 0, -offset, pageWidth, imageHeight)
    }

    pdf.save(invoiceFileName(order))
  } finally {
    frame.remove()
  }
}
