import { strToU8, zipSync } from 'fflate';
import type { ReportFilters, ReportOrder } from './reporting';

const HEADERS = [
  'Invoice',
  'Tanggal Pesanan',
  'Pelanggan',
  'Email',
  'WhatsApp',
  'Produk',
  'Subtotal',
  'Diskon',
  'Total',
  'Kupon',
  'Status',
  'Pembayaran Disetujui',
  'Produk Dikirim',
  'Pesanan Selesai',
  'Jumlah Unduhan',
];

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnName(index: number): string {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function dateSerial(date: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );

  const jakartaWallClock = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    date.getUTCMilliseconds(),
  );
  return jakartaWallClock / 86_400_000 + 25_569;
}

function stringCell(ref: string, value: string, style = 0): string {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}

function numberCell(ref: string, value: number, style = 0): string {
  return `<c r="${ref}" s="${style}"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
}

function dateCell(ref: string, value: Date | null): string {
  return value ? numberCell(ref, dateSerial(value), 3) : stringCell(ref, '', 0);
}

function formulaCell(ref: string, formula: string, value: number, style: number): string {
  return `<c r="${ref}" s="${style}"><f>${xml(formula)}</f><v>${value}</v></c>`;
}

function worksheetXml(orders: ReportOrder[]): string {
  const headerCells = HEADERS.map((header, index) => stringCell(`${columnName(index)}1`, header, 1)).join('');
  const rows = orders.map((order, index) => {
    const row = index + 2;
    const downloads = order.entitlements.reduce((total, entitlement) => total + entitlement.downloadCount, 0);
    const products = order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ');
    const cells = [
      stringCell(`A${row}`, order.invoice),
      dateCell(`B${row}`, order.createdAt),
      stringCell(`C${row}`, order.customerName),
      stringCell(`D${row}`, order.customerEmail),
      stringCell(`E${row}`, order.customerWhatsapp, 7),
      stringCell(`F${row}`, products, 4),
      numberCell(`G${row}`, order.subtotal, 2),
      numberCell(`H${row}`, order.discount, 2),
      numberCell(`I${row}`, order.total, 2),
      stringCell(`J${row}`, order.couponCode || ''),
      stringCell(`K${row}`, order.status),
      dateCell(`L${row}`, order.paymentApprovedAt),
      dateCell(`M${row}`, order.productSentAt),
      dateCell(`N${row}`, order.completedAt),
      numberCell(`O${row}`, downloads, 0),
    ].join('');
    return `<row r="${row}" ht="30" customHeight="1">${cells}</row>`;
  }).join('');

  const totalRow = orders.length + 2;
  const firstDataRow = 2;
  const lastDataRow = Math.max(firstDataRow, orders.length + 1);
  const totals = {
    subtotal: orders.reduce((sum, order) => sum + order.subtotal, 0),
    discount: orders.reduce((sum, order) => sum + order.discount, 0),
    total: orders.reduce((sum, order) => sum + order.total, 0),
    downloads: orders.reduce((sum, order) => sum + order.entitlements.reduce((itemSum, item) => itemSum + item.downloadCount, 0), 0),
  };
  const totalCells = [
    stringCell(`F${totalRow}`, 'TOTAL', 5),
    formulaCell(`G${totalRow}`, `SUM(G${firstDataRow}:G${lastDataRow})`, totals.subtotal, 6),
    formulaCell(`H${totalRow}`, `SUM(H${firstDataRow}:H${lastDataRow})`, totals.discount, 6),
    formulaCell(`I${totalRow}`, `SUM(I${firstDataRow}:I${lastDataRow})`, totals.total, 6),
    formulaCell(`O${totalRow}`, `SUM(O${firstDataRow}:O${lastDataRow})`, totals.downloads, 5),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  <cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="21" customWidth="1"/><col min="3" max="3" width="24" customWidth="1"/><col min="4" max="5" width="28" customWidth="1"/><col min="6" max="6" width="42" customWidth="1"/><col min="7" max="9" width="16" customWidth="1"/><col min="10" max="11" width="20" customWidth="1"/><col min="12" max="14" width="22" customWidth="1"/><col min="15" max="15" width="16" customWidth="1"/></cols>
  <sheetData><row r="1" ht="28" customHeight="1">${headerCells}</row>${rows}<row r="${totalRow}" ht="26" customHeight="1">${totalCells}</row></sheetData>
  <autoFilter ref="A1:O${Math.max(1, orders.length + 1)}"/>
  <pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;Rp&quot; #,##0"/><numFmt numFmtId="165" formatCode="dd mmm yyyy hh:mm"/></numFmts>
  <fonts count="3"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FF111111"/><sz val="11"/><name val="Aptos"/></font></fonts>
  <fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF6657E8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF1EDE3"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFE5E2D9"/></left><right style="thin"><color rgb="FFE5E2D9"/></right><top style="thin"><color rgb="FFE5E2D9"/></top><bottom style="thin"><color rgb="FFE5E2D9"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

export function buildSalesReportXlsx(orders: ReportOrder[], filters: ReportFilters): Uint8Array {
  const createdAt = new Date().toISOString();
  const title = `Laporan Penjualan ${filters.from} sampai ${filters.to}`;
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`),
    'docProps/app.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Digital Atelier</Application></Properties>`),
    'docProps/core.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(title)}</dc:title><dc:creator>Digital Atelier</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created></cp:coreProperties>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Laporan Penjualan" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': strToU8(STYLES_XML),
    'xl/worksheets/sheet1.xml': strToU8(worksheetXml(orders)),
  };
  return zipSync(files, { level: 6 });
}
