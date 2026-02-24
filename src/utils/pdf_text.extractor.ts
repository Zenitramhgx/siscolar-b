export interface PdfTextResultado {
    texto: string;
    meta: {
        paginas: number;
        caracteres: number;
        fuente: 'PDF_TEXT';
    };
}

export const extraerTextoPdf = async (
    buffer: Buffer
): Promise<PdfTextResultado> => {

    const pdfModule = await import('pdf-parse');

    const pdfParse = (pdfModule.default ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdfModule) as unknown as (buffer: Buffer) => Promise<any>;

    const data = await pdfParse(buffer);

    const textoNormalizado = data.text
        .replace(/[\t\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        texto: textoNormalizado,
        meta: {
            paginas: data.numpages,
            caracteres: textoNormalizado.length,
            fuente: 'PDF_TEXT',
        },
    };
};
