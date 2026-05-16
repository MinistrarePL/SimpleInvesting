import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

/** Tekst ze strony PDF (PDF.js textContent). */
export async function extractPdfPages(buffer: Buffer): Promise<
  { pageNum: number; text: string }[]
> {
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const out: { pageNum: number; text: string }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const parts = textContent.items.map((item: { str?: string }) =>
      'str' in item && typeof item.str === 'string' ? item.str : '',
    );
    const text = normalizeExtractedPdfText(parts.join(' '));
    out.push({ pageNum: i, text });
  }

  return out;
}

function normalizeExtractedPdfText(raw: string): string {
  return raw
    .replace(/\u00ad/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
