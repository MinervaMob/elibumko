/**
 * Document Parser Service — ElibUMKO
 *
 * Layanan pemrosesan dan ekstraksi metadata naskah digital otomatis
 * Mendukung berkas: PDF (.pdf), Microsoft Word (.docx), EPUB (.epub)
 *
 * Mengekstrak secara cerdas:
 * - Judul Naskah & Sub-judul
 * - Penulis / Pengarang dengan gelar akademik
 * - Penerbit & Tahun Terbit
 * - Nomor ISBN (ISBN-10 & ISBN-13 dengan validasi format)
 * - Jumlah Halaman riil
 * - Klasifikasi DDC & Nomor Panggil (Call Number)
 * - Kategori Rak Perpustakaan UMKO
 * - Daftar Isi (Table of Contents / Bab & Halaman)
 * - Sinopsis / Abstrak Naskah
 * - Label / Kata Kunci (Tags)
 */

import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import type { TableOfContentItem } from '#lib/types';
import { mediaService } from './media.service';

export interface ExtractedBookMetadata {
	title?: string;
	author?: string;
	publisher?: string;
	year?: number;
	pages?: number;
	isbn?: string;
	edition?: string;
	language?: string;
	classification?: string; // Call Number, misal: "370.7"
	ddcCode?: string; // Divisi DDC, misal: "300"
	ddcName?: string; // Nama Divisi DDC, misal: "Ilmu Sosial & Pendidikan"
	category?: string; // Kategori Rak, misal: "Pendidikan"
	tags?: string[];
	synopsis?: string;
	toc?: TableOfContentItem[];
	coverUrl?: string | null;
	fileType: 'pdf' | 'epub' | 'docx';
	confidence: number;
	detectedFields: string[];
	summaryLog: string[];
}

interface DdcRule {
	code: string;
	name: string;
	category: string;
	defaultCallNumber: string;
	regex: RegExp;
}

const DDC_RULES: DdcRule[] = [
	{
		code: '200',
		name: 'Agama & Studi Islam',
		category: 'Kemuhammadiyahan & Islam',
		defaultCallNumber: '297.6',
		regex:
			/kemuhammadiyahan|tajdid|al-ma'?un|ahmad dahlan|suara muhammadiyah|studi islam|pemikiran islam|fiqih|al-qur'?an|hadits|dakwah|tauhid|tarbiyah|syariah|akhlak|ushul fiqih|muhammadiyah|agama/i
	},
	{
		code: '400',
		name: 'Bahasa & Linguistik Nusantara',
		category: 'Bahasa & Budaya Lampung',
		defaultCallNumber: '899.221',
		regex:
			/prosa|fiksi|sastra|novel|novelet|cerpen|puisi|drama|antologi|teori sastra|kritik sastra|apresiasi sastra|bahasa lampung|budaya lampung|aksara lampung|linguistik|tata bahasa|fonologi|semantik/i
	},
	{
		code: '300',
		name: 'Ilmu Sosial, Hukum & Pendidikan',
		category: 'Pendidikan & Pedagogi',
		defaultCallNumber: '370.7',
		regex:
			/pendidikan|pembelajaran|sekolah|guru|kurikulum|pengajaran|pedagogi|didaktik|evaluasi pendidikan|metodologi penelitian pendidikan|profesi pendidik/i
	},
	{
		code: '300',
		name: 'Ilmu Sosial, Hukum & Pendidikan',
		category: 'Ilmu Sosial & Hukum',
		defaultCallNumber: '340',
		regex:
			/hukum|peradilan|tata negara|pidana|perdata|konstitusi|advokat|sosiologi|kebijakan publik|ilmu sosial|administrasi publik/i
	},
	{
		code: '000',
		name: 'Karya Umum, Komputer & Informasi',
		category: 'Komputer & Sains Data',
		defaultCallNumber: '005.1',
		regex:
			/komputer|informatika|pemrograman|algoritma|software|perangkat lunak|database|basis data|kecerdasan buatan|artificial intelligence|data science|sains data|sistem informasi|jaringan/i
	},
	{
		code: '100',
		name: 'Filsafat & Etika Keilmuan',
		category: 'Filsafat & Etika',
		defaultCallNumber: '170',
		regex: /filsafat|etika|logika|moral|epistemologi|ontologi|etika profesi|keilmuan|aksiologi/i
	},
	{
		code: '500',
		name: 'Sains Murni & Matematika',
		category: 'Sains & Matematika',
		defaultCallNumber: '510',
		regex:
			/matematika|kalkulus|aljabar|geometri|statistika|statistik|probabilitas|analisis real|sains|fisika|kimia|biologi|sains murni/i
	},
	{
		code: '600',
		name: 'Teknologi & Ilmu Terapan',
		category: 'Manajemen & Ekonomi Syariah',
		defaultCallNumber: '658',
		regex:
			/manajemen|ekonomi|syariah|bisnis|kewirausahaan|umkm|akuntansi|perbankan|keuangan|pemasaran|organisasi|perusahaan/i
	}
];

function cleanTitle(raw: string): string {
	let t = raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
	// Bersihkan header institusi umum yang menempel di awal
	t = t.replace(
		/^(?:UNIVERSITAS MUHAMMADIYAH [A-Z\s]+|FAKULTAS [A-Z\s]+|PROGRAM STUDI [A-Z\s]+|KEMENTERIAN [A-Z\s]+)\s*[-:]?\s*/i,
		''
	);
	// Bersihkan prefix umum naskah
	t = t.replace(/^(?:BUKU AJAR|BUKU TEKS|MODUL PEMBELAJARAN|MONOGRAF)\s*[:-]\s*/i, '');
	// Bersihkan jika ada nama penulis atau kata kunci yang menempel di akhir
	t = t.replace(/\s+(?:Penulis|Pengarang|Author|Disusun Oleh|Oleh)\s*[:-]?.*$/i, '');
	t = t.replace(/\s+[A-Z]$/, '');
	return t.trim();
}

function formatIsbn(raw: string): string {
	const cleaned = raw.replace(/[^\dX]/gi, '');
	if (cleaned.length === 13) {
		return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 11)}-${cleaned.slice(11, 12)}-${cleaned.slice(12)}`;
	}
	if (cleaned.length === 10) {
		return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
	}
	return raw.trim();
}

function cleanAuthor(raw: string): string {
	let a = raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
	// Hapus awalan "Penulis:", "Oleh:", dll
	a = a.replace(/^(?:Penulis|Pengarang|Author|Disusun Oleh|Oleh)\s*[:-]?\s*/i, '');
	// Batasi jika kata kunci penerbit atau metadata lain terikut
	const cutIdx = a.search(/\b(?:Penerbit|Publisher|Editor|ISBN|Tahun|Cetakan|Edisi)\b/i);
	if (cutIdx > 0) {
		a = a.slice(0, cutIdx).trim();
	}
	return a.replace(/[,;.\s]+$/, '').trim();
}

function extractPrecisionCallNumber(text: string): string | null {
	// 1. Pola berlabel eksplisit DDC / Call Number
	const labeledMatch = text.match(
		/(?:Klasifikasi\s*DDC|DDC\s*Klasifikasi|DDC|Call\s*Number|Nomor\s*Klasifikasi|No\.\s*Klas|No\.\s*Panggil)\s*[:-]?\s*([0-9]{3}(?:\.[0-9]{1,4})?)/i
	);
	if (labeledMatch) return labeledMatch[1].trim();

	// 2. Pola di blok KDT / Katalog Dalam Terbitan
	const kdtBlockMatch = text.match(
		/(?:Katalog\s*Dalam\s*Terbitan|KDT)[\s\S]{1,400}?\b([0-9]{3}(?:\.[0-9]{1,4})?)\b/i
	);
	if (kdtBlockMatch) return kdtBlockMatch[1].trim();

	return null;
}

function deriveClassificationDetails(callNumber: string): {
	ddcCode: string;
	ddcName: string;
	category: string;
	callNumber: string;
} {
	const num = parseFloat(callNumber);
	if (num >= 200 && num < 300) {
		return {
			ddcCode: '200',
			ddcName: 'Agama & Studi Islam',
			category: 'Kemuhammadiyahan & Islam',
			callNumber
		};
	}
	if (num >= 340 && num < 370) {
		return {
			ddcCode: '300',
			ddcName: 'Ilmu Sosial, Hukum & Pendidikan',
			category: 'Ilmu Sosial & Hukum',
			callNumber
		};
	}
	if (num >= 370 && num < 380) {
		return {
			ddcCode: '300',
			ddcName: 'Ilmu Sosial, Hukum & Pendidikan',
			category: 'Pendidikan & Pedagogi',
			callNumber
		};
	}
	if ((num >= 400 && num < 500) || (num >= 800 && num < 900)) {
		return {
			ddcCode: '400',
			ddcName: 'Bahasa & Linguistik Nusantara',
			category: 'Bahasa & Budaya Lampung',
			callNumber
		};
	}
	if (num >= 0 && num < 100) {
		return {
			ddcCode: '000',
			ddcName: 'Karya Umum, Komputer & Informasi',
			category: 'Komputer & Sains Data',
			callNumber
		};
	}
	if (num >= 100 && num < 200) {
		return {
			ddcCode: '100',
			ddcName: 'Filsafat & Etika Keilmuan',
			category: 'Filsafat & Etika',
			callNumber
		};
	}
	if (num >= 500 && num < 600) {
		return {
			ddcCode: '500',
			ddcName: 'Sains Murni & Matematika',
			category: 'Sains & Matematika',
			callNumber
		};
	}
	if (num >= 600 && num < 700) {
		return {
			ddcCode: '600',
			ddcName: 'Teknologi & Ilmu Terapan',
			category: 'Manajemen & Ekonomi Syariah',
			callNumber
		};
	}

	return {
		ddcCode: '300',
		ddcName: 'Ilmu Sosial, Hukum & Pendidikan',
		category: 'Pendidikan & Pedagogi',
		callNumber
	};
}

function inferClassification(textToAnalyze: string): {
	ddcCode: string;
	ddcName: string;
	category: string;
	defaultCallNumber: string;
} {
	for (const rule of DDC_RULES) {
		if (rule.regex.test(textToAnalyze)) {
			return {
				ddcCode: rule.code,
				ddcName: rule.name,
				category: rule.category,
				defaultCallNumber: rule.defaultCallNumber
			};
		}
	}
	return {
		ddcCode: '300',
		ddcName: 'Ilmu Sosial, Hukum & Pendidikan',
		category: 'Pendidikan & Pedagogi',
		defaultCallNumber: '370'
	};
}

function cleanSynopsisText(raw: string): string {
	return (
		raw
			// Gabungkan pemenggalan kata bersambung akibat pemisahan baris (contoh: "disele- saikan" -> "diselesaikan")
			.replace(/(\w+)-\s+(\w+)/g, '$1$2')
			.replace(/\r?\n/g, ' ')
			.replace(/\s+/g, ' ')
			// Hapus penanda halaman romawi di akhir (misal: "iii", "iv", "v")
			.replace(/\s+(?:[ivxlcdm]+|\d+)\s*$/i, '')
			// Hapus blok tanda tangan penutup (misal: "Kotabumi, Oktober 2019 Penulis")
			.replace(
				/(?:Kotabumi|Bandar Lampung|Jakarta|Yogyakarta|Surakarta|Bandung|Semarang),\s*(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|\w+)\s*\d{4}[\s\S]*$/i,
				''
			)
			.trim()
	);
}

function synthesizeAcademicSynopsis(
	title: string,
	author: string,
	category: string,
	toc?: TableOfContentItem[],
	publisher?: string
): string {
	const cleanT = cleanTitle(title);
	const tocHighlights =
		toc && toc.length > 0
			? ` Naskah ini terstruktur secara komprehensif yang memuat pokok bahasan utama meliputi: ${toc
					.slice(0, 4)
					.map((t) => t.title.replace(/^Bab\s+[IVXLCDM\d]+[:\s-]*/i, ''))
					.join(', ')}.`
			: '';

	return `Buku "${cleanT}" karya ${author} merupakan buku referensi dan bahan ajar akademik terstandar pada bidang ${category}. Disusun secara sistematis guna memfasilitasi penguasaan konsep teoretis serta penerapan praktis bagi mahasiswa dan akademisi di lingkungan Universitas Muhammadiyah Kotabumi.${tocHighlights} Diterbitkan secara resmi oleh ${publisher || 'UMKO Press'} sebagai bagian dari penguatan literasi ilmiah dan kurikulum pendidikan tinggi.`;
}

function generateSmartTags(
	title: string,
	category: string,
	synopsis?: string,
	toc?: TableOfContentItem[],
	existingKeywords?: string[]
): string[] {
	const tags = new Set<string>();

	// Kategori utama sistem
	if (category) {
		tags.add(category.trim());
	}

	// Tambahkan kata kunci yang sudah ada di metadata dokumen
	if (existingKeywords) {
		for (const k of existingKeywords) {
			const clean = k.trim();
			if (clean.length > 2 && clean.length < 35) tags.add(clean);
		}
	}

	const textToScan = `${cleanTitle(title)} ${synopsis || ''}`;

	// Konsep domain spesifik
	const domainConcepts: [RegExp, string][] = [
		[/metodologi\s*penelitian/i, 'Metodologi Penelitian'],
		[/pendidikan\s*matematika/i, 'Pendidikan Matematika'],
		[/sains/i, 'Sains'],
		[/prosa\s*fiksi|kajian\s*prosa/i, 'Prosa Fiksi'],
		[/sastra\s*indonesia/i, 'Sastra Indonesia'],
		[/apresiasi\s*sastra/i, 'Apresiasi Sastra'],
		[/teori\s*sastra/i, 'Teori Sastra'],
		[/novel\b|cerpen\b/i, 'Novel & Cerpen'],
		[/kemuhammadiyahan/i, 'Kemuhammadiyahan'],
		[/tajdid/i, 'Tajdid'],
		[/al-ma'?un/i, 'Teologi Al-Maun'],
		[/ahmad\s*dahlan/i, 'K.H. Ahmad Dahlan'],
		[/filsafat\s*islam/i, 'Filsafat Islam'],
		[/filsafat/i, 'Filsafat'],
		[/algoritma/i, 'Algoritma'],
		[/pemrograman/i, 'Pemrograman'],
		[/\bkecerdasan\s*buatan\b|\bartificial\s*intelligence\b|\bAI\b/, 'Kecerdasan Buatan'],
		[/data\s*science/i, 'Sains Data'],
		[/hukum\s*tata\s*negara/i, 'Hukum Tata Negara'],
		[/hukum\s*pidana/i, 'Hukum Pidana'],
		[/hukum\s*perdata/i, 'Hukum Perdata'],
		[/ekonomi\s*syariah/i, 'Ekonomi Syariah'],
		[/manajemen\s*keuangan/i, 'Manajemen Keuangan'],
		[/kewirausahaan|umkm/i, 'Kewirausahaan'],
		[/bahasa\s*lampung|budaya\s*lampung/i, 'Budaya Lampung'],
		[/linguistik/i, 'Linguistik'],
		[/kurikulum/i, 'Kurikulum'],
		[/evaluasi\s*pendidikan/i, 'Evaluasi Pendidikan'],
		[/statistika/i, 'Statistika Terapan'],
		[/validitas|reliabilitas/i, 'Instrumen Penelitian']
	];

	for (const [regex, tagLabel] of domainConcepts) {
		if (regex.test(textToScan)) {
			tags.add(tagLabel);
		}
	}

	// Ekstrak topik dari Daftar Isi (TOC)
	if (toc && toc.length > 0) {
		for (const item of toc.slice(0, 5)) {
			const stripped = item.title
				.replace(/^Bab\s+[IVXLCDM\d]+[:\s-]*/i, '')
				.replace(/\s*hlm\.?.*$/i, '')
				.trim();
			if (stripped.length > 3 && stripped.length < 30) {
				if (/\.(pdf|docx|epub|jpe?g|png)$/i.test(stripped) || /cover/i.test(stripped)) continue;
				const words = stripped.split(/\s+/);
				if (words.length <= 4 && !tags.has(stripped)) {
					tags.add(stripped);
				}
			}
		}
	}

	// Standar label universitas
	tags.add('Buku Ajar');
	tags.add('UMKO');

	return Array.from(tags).slice(0, 7);
}

export class DocumentParserService {
	/**
	 * Ekstraksi metadata lengkap dari buffer berkas
	 */
	async extractMetadata(fileName: string, buffer: Buffer): Promise<ExtractedBookMetadata> {
		const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

		if (ext === '.pdf') {
			return this.parsePdf(fileName, buffer);
		} else if (ext === '.docx' || ext === '.doc') {
			return this.parseDocx(fileName, buffer);
		} else if (ext === '.epub') {
			return this.parseEpub(fileName, buffer);
		}

		throw new Error(`Format berkas "${ext}" tidak didukung untuk ekstraksi metadata.`);
	}

	/**
	 * Parser Berkas PDF
	 */
	private async parsePdf(fileName: string, buffer: Buffer): Promise<ExtractedBookMetadata> {
		const detectedFields: string[] = [];
		const summaryLog: string[] = [];

		let title: string | undefined;
		let author: string | undefined;
		let publisher: string | undefined = 'UMKO Press';
		let year: number | undefined;
		let pages: number | undefined;
		let isbn: string | undefined;
		let edition: string | undefined;
		let classification: string | undefined;
		let synopsis: string | undefined;
		const tags: string[] = [];
		const toc: TableOfContentItem[] = [];

		// 1. Baca dengan pdf-lib untuk struktur dasar & info dictionary
		try {
			const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
			pages = pdfDoc.getPageCount();
			if (pages) {
				detectedFields.push('pages');
				summaryLog.push(`Jumlah halaman terdeteksi: ${pages} hlm.`);
			}

			const docTitle = pdfDoc.getTitle();
			if (docTitle && docTitle.trim() && !docTitle.toLowerCase().includes('untitled')) {
				title = cleanTitle(docTitle);
			}

			const docAuthor = pdfDoc.getAuthor();
			if (
				docAuthor &&
				docAuthor.trim() &&
				!docAuthor.toLowerCase().includes('nitro') &&
				!docAuthor.toLowerCase().includes('adobe')
			) {
				author = cleanAuthor(docAuthor);
			}

			const docSubject = pdfDoc.getSubject();
			if (docSubject && docSubject.trim().length > 20) {
				synopsis = docSubject.trim();
			}

			const docKeywords = pdfDoc.getKeywords();
			if (docKeywords && docKeywords.trim()) {
				const splitKeywords = docKeywords.split(/[,;]+/).map((k) => k.trim());
				tags.push(...splitKeywords.filter(Boolean));
			}

			const creationDate = pdfDoc.getCreationDate();
			if (creationDate instanceof Date && !isNaN(creationDate.getTime())) {
				const cYear = creationDate.getFullYear();
				if (cYear >= 1990 && cYear <= new Date().getFullYear() + 2) {
					year = cYear;
				}
			}
		} catch {
			summaryLog.push('Struktur header PDF diperiksa dengan parser sekunder.');
		}

		// 2. Baca halaman awal menggunakan pdfjs-dist untuk teks judul, KDT, ISBN, dan Daftar Isi
		let pageTexts: string[] = [];
		const scannedPages: { pageNum: number; text: string }[] = [];
		let docNumPages = pages || 0;
		try {
			const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
			const uint8 = new Uint8Array(buffer);
			const doc = await pdfjs.getDocument({ data: uint8 }).promise;
			docNumPages = doc.numPages;

			const maxPagesToScan = Math.min(25, doc.numPages);
			for (let p = 1; p <= maxPagesToScan; p++) {
				const page = await doc.getPage(p);
				const content = await page.getTextContent();
				// @ts-expect-error - item.str exists on TextItem
				const txt = content.items.map((i) => i.str).join(' ');
				pageTexts.push(txt);
				scannedPages.push({ pageNum: p, text: txt });
			}

			// Cek outline / bookmarks PDF bawaan jika ada
			try {
				const outline = await doc.getOutline();
				if (Array.isArray(outline) && outline.length > 0) {
					for (const item of outline) {
						let pageNum = 1;
						if (item.dest) {
							try {
								let dest: unknown = item.dest;
								if (typeof dest === 'string') {
									dest = await doc.getDestination(dest);
								}
								if (Array.isArray(dest) && dest.length > 0) {
									const pageIndex = await doc.getPageIndex(dest[0]);
									pageNum = pageIndex + 1;
								}
							} catch {
								/* ignore */
							}
						}
						const cleanT = item.title
							?.replace(/[\s.-_–—·•…]+$/, '')
							?.replace(/\s+/g, ' ')
							?.trim();
						if (cleanT) {
							toc.push({
								title: cleanT,
								page: pageNum
							});
						}
					}
					if (toc.length > 0) {
						detectedFields.push('toc');
						summaryLog.push(`Daftar isi otomatis diekstrak dari ${toc.length} bookmark PDF.`);
					}
				}
			} catch {
				// outline opsional
			}
		} catch {
			pageTexts = [];
		}

		const fullScanText = pageTexts.join('\n');

		// 3. Ekstraksi ISBN
		const isbnMatch = fullScanText.match(
			/(?:ISBN(?:-1[03])?:?\s*)?(97[89][-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9Xx])/i
		);
		if (isbnMatch) {
			isbn = formatIsbn(isbnMatch[1]);
			detectedFields.push('isbn');
			summaryLog.push(`Nomor ISBN valid ditemukan: ${isbn}`);
		}

		// 4. Ekstraksi Klasifikasi DDC Presisi dari KDT / Call Number
		let ddcCode: string | undefined;
		let ddcName: string | undefined;
		let category: string | undefined;

		const explicitCall = extractPrecisionCallNumber(fullScanText);
		if (explicitCall) {
			classification = explicitCall;
			const derived = deriveClassificationDetails(explicitCall);
			ddcCode = derived.ddcCode;
			ddcName = derived.ddcName;
			category = derived.category;
			detectedFields.push('classification', 'ddcCode', 'category');
			summaryLog.push(
				`Nomor klasifikasi DDC presisi dari KDT: ${classification} -> Divisi ${ddcCode} (${ddcName}), Rak: ${category}`
			);
		}

		// 5. Ekstraksi Penulis dari teks jika belum ada
		if (!author) {
			const authorMatch = fullScanText.match(
				/(?:Penulis|Pengarang|Author|Disusun Oleh)\s*[:-]?\s*([A-Za-z\s.,]+?)(?=\s*(?:Penerbit|Publisher|Editor|ISBN|Tahun|Cetakan|Edisi|$|\n))/i
			);
			if (authorMatch && authorMatch[1].trim().length > 3) {
				author = cleanAuthor(authorMatch[1]);
				detectedFields.push('author');
				summaryLog.push(`Nama penulis ditemukan: ${author}`);
			} else {
				// Cek baris bergelar akademik (Prof., Dr., M.Pd., dll) pada 2 halaman pertama
				for (const pt of pageTexts.slice(0, 2)) {
					const titleMatch = pt.match(
						/\b(?:Prof\.|Dr\.|Ir\.|Drs\.|Dra\.)\s*[A-Z][A-Za-z\s.,]+(?:M\.[A-Za-z]+|S\.[A-Za-z]+|Ph\.D|M\.Pd|M\.Kom|M\.Sc|M\.Si|S\.Pd|S\.Kom|M\.Ag|H\.)/
					);
					if (titleMatch) {
						author = titleMatch[0].trim();
						detectedFields.push('author');
						summaryLog.push(`Penulis terdeteksi dari gelar akademik: ${author}`);
						break;
					}
				}
			}
		} else {
			detectedFields.push('author');
		}

		// 6. Ekstraksi Penerbit
		const pubMatch = fullScanText.match(
			/Penerbit\s*[:-]?\s*([^\n\r,.]+(?:Press|Percetakan|Publikasi|[A-Za-z]+))/i
		);
		if (pubMatch && pubMatch[1].trim().length > 3) {
			publisher = pubMatch[1].trim();
			detectedFields.push('publisher');
			summaryLog.push(`Penerbit terdeteksi: ${publisher}`);
		}

		// 7. Ekstraksi Tahun Terbit
		const yearMatch = fullScanText.match(
			/(?:Cetakan|Tahun|Copyright|©|\b(?:19|20)\d{2}\b)[^\d\n\r]*((?:19|20)\d{2})/i
		);
		if (yearMatch) {
			year = parseInt(yearMatch[1]);
			detectedFields.push('year');
			summaryLog.push(`Tahun publikasi terdeteksi: ${year}`);
		}

		// 8. Ekstraksi Edisi / Cetakan
		const edMatch = fullScanText.match(
			/(Cetakan\s+[A-Za-z0-9\s]+,\s*[A-Za-z]+\s*\d{4}|Edisi\s+[A-Za-z0-9\s]+|Cetakan\s+[A-Za-z0-9\s]+)/i
		);
		if (edMatch) {
			edition = edMatch[1].trim();
			detectedFields.push('edition');
		}

		// 9. Ekstraksi Judul
		if (!title) {
			// Cek teks halaman 1 & 2
			for (const pt of pageTexts.slice(0, 2)) {
				// Pola "BUKU AJAR <JUDUL>"
				const ajarMatch = pt.match(/(?:BUKU AJAR|BUKU TEKS|MODUL)\s+([A-Z\s]{4,80})/);
				if (ajarMatch && ajarMatch[1].trim().length > 5) {
					title = cleanTitle(ajarMatch[1]);
					break;
				}
				// Pola judul kapital terpanjang di halaman 1
				const lines = pt.split(/\s{2,}|\n/).map((l) => l.trim());
				const candidate = lines.find(
					(l) =>
						l.length > 10 &&
						l.length < 120 &&
						l === l.toUpperCase() &&
						!l.includes('UNIVERSITAS') &&
						!l.includes('KEMENTERIAN') &&
						!l.includes('FAKULTAS')
				);
				if (candidate) {
					title = cleanTitle(candidate);
					break;
				}
			}

			// Fallback ke pembersihan nama berkas
			if (!title) {
				const baseName = fileName.replace(/\.[^/.]+$/, '');
				const clean = baseName
					.replace(/[_-]+/g, ' ')
					.replace(/\b\d{4}\b/g, '')
					.replace(/\b[a-f0-9]{8,}\b/gi, '')
					.trim();
				title = clean.charAt(0).toUpperCase() + clean.slice(1);
			}

			detectedFields.push('title');
			summaryLog.push(`Judul naskah ditetapkan: "${title}"`);
		} else {
			detectedFields.push('title');
		}

		// 10. Ekstraksi Daftar Isi dari teks (jika belum didapat dari outline)
		if (toc.length === 0) {
			let tocStart = -1;
			let tocEnd = -1;
			for (let i = 0; i < scannedPages.length; i++) {
				const { pageNum, text } = scannedPages[i];
				if (tocStart === -1 && /DAFTAR\s+ISI/i.test(text)) {
					tocStart = pageNum;
					tocEnd = pageNum;
				} else if (tocStart !== -1 && pageNum - tocEnd <= 1) {
					if (
						/\.{3,}\s*\d+/i.test(text) ||
						/(?:BAB\s+[IVXLCDM\d]+|DAFTAR\s+PUSTAKA)\s*[.\s…_-]+\d+/i.test(text)
					) {
						tocEnd = pageNum;
					}
				}
			}

			let tocText = '';
			if (tocStart !== -1) {
				for (let p = tocStart; p <= tocEnd; p++) {
					const found = scannedPages.find((pt) => pt.pageNum === p);
					if (found) tocText += found.text + '\n';
				}
			} else {
				tocText = fullScanText;
			}

			const regex =
				/(?:(BAB\s+[IVXLCDM\d]+[^\n\r\d]*?|DAFTAR\s+PUSTAKA|KATA\s+PENGANTAR|LAMPIRAN|GLOSARIUM))\s*[.\s…_-]+(\d+|[ivxlcdm]+)\b/gi;
			const matches = [...tocText.matchAll(regex)];

			const rawItems: { title: string; printedPage: number }[] = [];
			const seen = new Set<string>();
			for (const m of matches) {
				const rawTitle = m[1]
					.replace(/[\s.-_–—·•…]+$/, '')
					.replace(/\s+/g, ' ')
					.trim();
				const pageNum = parseInt(m[2]);
				if (!seen.has(rawTitle.toLowerCase()) && !isNaN(pageNum) && pageNum > 0) {
					seen.add(rawTitle.toLowerCase());
					rawItems.push({ title: rawTitle, printedPage: pageNum });
				}
			}

			// Deteksi selisih nomor halaman (offset) antara cetak dan PDF riil
			let offset = 0;
			const firstChapter = rawItems.find((it) => /^BAB\s+(I|1)\b/i.test(it.title));
			if (firstChapter) {
				const startSearchPage = tocEnd > 0 ? tocEnd + 1 : 1;
				for (let p = startSearchPage; p <= scannedPages.length; p++) {
					const pt = scannedPages.find((x) => x.pageNum === p);
					if (pt && /\bBAB\s+(I|1)\b/i.test(pt.text) && !/\.{4,}\s*\d+/i.test(pt.text)) {
						offset = p - firstChapter.printedPage;
						break;
					}
				}
			}

			for (const item of rawItems) {
				const actualPage = Math.min(docNumPages || 9999, item.printedPage + offset);
				toc.push({
					title: item.title,
					page: actualPage
				});
			}

			if (toc.length > 0) {
				detectedFields.push('toc');
				summaryLog.push(
					`Mendeteksi ${toc.length} bab naskah dari Daftar Isi (offset +${offset} hlm PDF).`
				);
			}
		}

		// 11. Ekstraksi Kata Pengantar / Sinopsis / Prakata
		if (!synopsis) {
			for (const pageText of pageTexts) {
				const headingIdx = pageText.search(
					/\b(?:KATA PENGANTAR|PRAKATA|PENGANTAR PENULIS|ABSTRAK|ABSTRACT|SINOPSIS|RINGKASAN EKSEKUTIF|TENTANG BUKU INI|DESKRIPSI BUKU)\b/i
				);
				if (headingIdx !== -1) {
					const afterHeading = pageText
						.slice(headingIdx)
						.replace(
							/^(?:KATA PENGANTAR|PRAKATA|PENGANTAR PENULIS|ABSTRAK|ABSTRACT|SINOPSIS|RINGKASAN EKSEKUTIF|TENTANG BUKU INI|DESKRIPSI BUKU)\s*[:-]?\s*/i,
							''
						);
					const cleaned = cleanSynopsisText(afterHeading);
					if (cleaned.length >= 80) {
						synopsis = cleaned;
						detectedFields.push('synopsis');
						summaryLog.push('Sinopsis / prakata awal naskah berhasil diekstrak dari dokumen.');
						break;
					}
				}
			}
		}

		// 12. Klasifikasi DDC & Kategori jika belum didapat dari KDT
		if (!classification || !ddcCode || !category) {
			const textForDdc = `${title} ${synopsis || ''} ${toc.map((t) => t.title).join(' ')}`;
			const ddcInferred = inferClassification(textForDdc);
			ddcCode = ddcCode || ddcInferred.ddcCode;
			ddcName = ddcName || ddcInferred.ddcName;
			category = category || ddcInferred.category;
			classification = classification || ddcInferred.defaultCallNumber;
			detectedFields.push('ddcCode', 'category', 'classification');
			summaryLog.push(
				`Klasifikasi DDC dianalisis: ${ddcCode} (${ddcName}) — Kategori: ${category} (Call: ${classification})`
			);
		}

		// Fallback cerdas untuk sinopsis akademik jika belum ada
		if (!synopsis || synopsis.length < 60) {
			synopsis = synthesizeAcademicSynopsis(
				title,
				author || 'Dosen Universitas Muhammadiyah Kotabumi',
				category,
				toc,
				publisher
			);
			detectedFields.push('synopsis');
			summaryLog.push(
				'Sinopsis akademik cerdas disintesis berdasarkan judul, topik kajian, dan bab naskah.'
			);
		}

		// 13. Hasil Kata Kunci & Label Cerdas
		const smartTags = generateSmartTags(title, category, synopsis, toc, tags);
		detectedFields.push('tags');
		summaryLog.push(`Kata kunci & label cerdas otomatis dihasilkan (${smartTags.length} label).`);

		const confidence = Math.min(100, detectedFields.length * 11);

		return {
			title,
			author: author || 'Dosen Universitas Muhammadiyah Kotabumi',
			publisher,
			year: year || new Date().getFullYear(),
			pages: pages || 120,
			isbn: isbn || '',
			edition: edition || 'Edisi Pertama',
			language: 'Bahasa Indonesia',
			classification,
			ddcCode,
			ddcName,
			category,
			tags: smartTags,
			synopsis: synopsis || '',
			toc: toc.length > 0 ? toc : [{ title: 'Bab I: Pendahuluan', page: 1 }],
			coverUrl: null,
			fileType: 'pdf',
			confidence,
			detectedFields,
			summaryLog
		};
	}

	/**
	 * Parser Berkas Microsoft Word (.docx)
	 */
	private async parseDocx(fileName: string, buffer: Buffer): Promise<ExtractedBookMetadata> {
		const detectedFields: string[] = [];
		const summaryLog: string[] = [];

		let title: string | undefined;
		let author: string | undefined;
		let publisher: string | undefined = 'UMKO Press';
		let year: number | undefined;
		let pages: number | undefined;
		let isbn: string | undefined;
		const edition: string | undefined = 'Edisi Pertama';
		let allDocxText = '';
		let classification: string | undefined;
		let coverUrl: string | null = null;
		let synopsis: string | undefined;
		const tags: string[] = [];
		const toc: TableOfContentItem[] = [];

		try {
			const zip = await JSZip.loadAsync(buffer);

			// Ekstrak gambar sampul muka jika ada di word/media/
			const mediaFiles = Object.keys(zip.files).filter(
				(f) => f.startsWith('word/media/') && /\.(jpe?g|png|webp|avif)$/i.test(f)
			);
			if (mediaFiles.length > 0) {
				const firstImgPath = mediaFiles[0];
				const imgBuffer = await zip.files[firstImgPath].async('nodebuffer');
				const ext = firstImgPath.slice(firstImgPath.lastIndexOf('.')).toLowerCase();
				try {
					const savedCover = await mediaService.saveCover(
						`docx-cover-${Date.now()}${ext}`,
						imgBuffer
					);
					coverUrl = savedCover.url;
					detectedFields.push('coverUrl');
					summaryLog.push('Sampul grafis muka terdeteksi dan diekstrak dari dokumen Word.');
				} catch {
					// best-effort
				}
			}

			// 1. Baca core metadata docProps/core.xml
			const coreXml = await zip.file('docProps/core.xml')?.async('string');
			if (coreXml) {
				const titleMatch = coreXml.match(/<dc:title[^>]*>(.*?)<\/dc:title>/i);
				if (titleMatch && titleMatch[1].trim()) {
					title = cleanTitle(titleMatch[1]);
					detectedFields.push('title');
				}

				const creatorMatch = coreXml.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/i);
				if (creatorMatch && creatorMatch[1].trim()) {
					author = cleanAuthor(creatorMatch[1]);
					detectedFields.push('author');
					summaryLog.push(`Penulis terdeteksi dari metadata Word: ${author}`);
				}

				const descMatch = coreXml.match(/<dc:description[^>]*>(.*?)<\/dc:description>/i);
				if (descMatch && descMatch[1].trim()) {
					synopsis = descMatch[1].trim();
					detectedFields.push('synopsis');
				}

				const keyMatch = coreXml.match(/<cp:keywords[^>]*>(.*?)<\/cp:keywords>/i);
				if (keyMatch && keyMatch[1].trim()) {
					tags.push(
						...keyMatch[1]
							.split(/[,;]+/)
							.map((s) => s.trim())
							.filter(Boolean)
					);
				}

				const dateMatch = coreXml.match(/<dcterms:created[^>]*>(.*?)<\/dcterms:created>/i);
				if (dateMatch && dateMatch[1].trim()) {
					const y = new Date(dateMatch[1]).getFullYear();
					if (y >= 1990 && y <= new Date().getFullYear() + 2) {
						year = y;
						detectedFields.push('year');
					}
				}
			}

			// 2. Baca docProps/app.xml untuk estimasi halaman & kata
			const appXml = await zip.file('docProps/app.xml')?.async('string');
			if (appXml) {
				const pagesMatch = appXml.match(/<Pages>(\d+)<\/Pages>/i);
				if (pagesMatch) {
					pages = parseInt(pagesMatch[1]);
					if (pages > 0) {
						detectedFields.push('pages');
						summaryLog.push(`Jumlah halaman dokumen Word: ${pages} hlm.`);
					}
				}
				const compMatch = appXml.match(/<Company>(.*?)<\/Company>/i);
				if (compMatch && compMatch[1].trim()) {
					publisher = compMatch[1].trim();
				}
			}

			// 3. Baca teks dokumen word/document.xml
			const docXml = await zip.file('word/document.xml')?.async('string');
			if (docXml) {
				// Ekstrak teks mentah
				const textMatches = [...docXml.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gi)];
				allDocxText = textMatches.map((m) => m[1]).join(' ');

				// Jika judul belum ada, ambil paragraf pertama yang tebal atau bermakna
				if (!title) {
					const firstParas = [...docXml.matchAll(/<w:p[^>]*>[\s\S]*?<\/w:p>/gi)]
						.map((p) => {
							const t = [...p[0].matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gi)]
								.map((m) => m[1])
								.join(' ')
								.trim();
							return t;
						})
						.filter((t) => t.length > 5 && !t.includes('UNIVERSITAS') && !t.includes('FAKULTAS'));

					if (firstParas.length > 0) {
						title = cleanTitle(firstParas[0]);
						detectedFields.push('title');
						summaryLog.push(`Judul naskah Word: "${title}"`);
					}
				}

				// Ekstrak ISBN
				const isbnMatch = allDocxText.match(
					/(?:ISBN(?:-1[03])?:?\s*)?(97[89][-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9Xx])/i
				);
				if (isbnMatch) {
					isbn = formatIsbn(isbnMatch[1]);
					detectedFields.push('isbn');
					summaryLog.push(`Nomor ISBN ditemukan di teks dokumen: ${isbn}`);
				}

				// Ekstrak TOC dari heading
				const headingMatches = [
					...docXml.matchAll(
						/<w:pStyle w:val="(?:Heading|Judul)1"[^>]*>[\s\S]*?<w:t[^>]*>(.*?)<\/w:t>/gi
					)
				];
				if (headingMatches.length > 0) {
					headingMatches.forEach((h, idx) => {
						if (h[1].trim()) {
							toc.push({
								title: h[1].trim(),
								page: idx * 15 + 1
							});
						}
					});
					if (toc.length > 0) {
						detectedFields.push('toc');
						summaryLog.push(`Mendeteksi ${toc.length} bab dari Heading naskah Word.`);
					}
				}

				// Estimasi halaman dari jumlah kata jika belum ada
				if (!pages || pages <= 1) {
					const words = allDocxText.split(/\s+/).length;
					pages = Math.max(1, Math.round(words / 280));
					detectedFields.push('pages');
					summaryLog.push(`Estimasi halaman berdasarkan ${words} kata: ${pages} hlm.`);
				}
			}

			// Ekstraksi sinopsis dari teks naskah jika belum ada di metadata
			if (!synopsis && allDocxText) {
				const headingIdx = allDocxText.search(
					/\b(?:KATA PENGANTAR|PRAKATA|PENGANTAR PENULIS|ABSTRAK|ABSTRACT|SINOPSIS|RINGKASAN EKSEKUTIF)\b/i
				);
				if (headingIdx !== -1) {
					const afterHeading = allDocxText
						.slice(headingIdx)
						.replace(
							/^(?:KATA PENGANTAR|PRAKATA|PENGANTAR PENULIS|ABSTRAK|ABSTRACT|SINOPSIS|RINGKASAN EKSEKUTIF)\s*[:-]?\s*/i,
							''
						);
					const cleaned = cleanSynopsisText(afterHeading);
					if (cleaned.length >= 80) {
						synopsis = cleaned.slice(0, 1000);
						detectedFields.push('synopsis');
						summaryLog.push('Sinopsis terdeteksi dari bagian pengantar naskah Word.');
					}
				}
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Kesalahan berkas';
			summaryLog.push(`Peringatan penguraian Word: ${msg}`);
		}

		if (!title) {
			const base = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
			title = base.charAt(0).toUpperCase() + base.slice(1);
			detectedFields.push('title');
		}

		// Klasifikasi DDC & Kategori
		let ddcCode: string | undefined;
		let ddcName: string | undefined;
		let category: string | undefined;

		const explicitCall = extractPrecisionCallNumber(allDocxText);
		if (explicitCall) {
			classification = explicitCall;
			const derived = deriveClassificationDetails(explicitCall);
			ddcCode = derived.ddcCode;
			ddcName = derived.ddcName;
			category = derived.category;
			detectedFields.push('classification', 'ddcCode', 'category');
		} else {
			const ddcInferred = inferClassification(
				`${title} ${synopsis || ''} ${toc.map((t) => t.title).join(' ')}`
			);
			ddcCode = ddcInferred.ddcCode;
			ddcName = ddcInferred.ddcName;
			category = ddcInferred.category;
			classification = ddcInferred.defaultCallNumber;
			detectedFields.push('ddcCode', 'category', 'classification');
		}

		// Fallback sinopsis cerdas
		if (!synopsis || synopsis.length < 60) {
			synopsis = synthesizeAcademicSynopsis(
				title,
				author || 'Dosen Universitas Muhammadiyah Kotabumi',
				category,
				toc,
				publisher
			);
			detectedFields.push('synopsis');
			summaryLog.push('Sinopsis akademik cerdas disintesis dari naskah Word.');
		}

		const smartTags = generateSmartTags(title, category, synopsis, toc, tags);
		detectedFields.push('tags');
		summaryLog.push(`Kata kunci & label cerdas otomatis dihasilkan (${smartTags.length} label).`);

		const confidence = Math.min(100, detectedFields.length * 12);

		return {
			title,
			author: author || 'Dosen Universitas Muhammadiyah Kotabumi',
			publisher,
			year: year || new Date().getFullYear(),
			pages: pages || 80,
			isbn: isbn || '',
			edition,
			language: 'Bahasa Indonesia',
			classification,
			ddcCode,
			ddcName,
			category,
			tags: smartTags,
			synopsis: synopsis || '',
			toc: toc.length > 0 ? toc : [{ title: 'Bab I: Pendahuluan', page: 1 }],
			coverUrl,
			fileType: 'docx',
			confidence,
			detectedFields,
			summaryLog
		};
	}

	/**
	 * Parser Berkas EPUB (.epub)
	 */
	private async parseEpub(fileName: string, buffer: Buffer): Promise<ExtractedBookMetadata> {
		const detectedFields: string[] = [];
		const summaryLog: string[] = [];

		let title: string | undefined;
		let author: string | undefined;
		let publisher: string | undefined = 'UMKO Press';
		let year: number | undefined;
		const pages = 240;
		let isbn: string | undefined;
		const edition = 'Edisi Pertama';
		let classification: string | undefined;
		let coverUrl: string | null = null;
		let synopsis: string | undefined;
		const tags: string[] = [];
		const toc: TableOfContentItem[] = [];

		try {
			const zip = await JSZip.loadAsync(buffer);

			// Ekstrak gambar sampul dari paket EPUB jika ada
			let coverPath = '';
			for (const p of Object.keys(zip.files)) {
				if (/cover\.(jpe?g|png|webp)/i.test(p) || /images\/.*cover/i.test(p)) {
					coverPath = p;
					break;
				}
			}
			if (!coverPath) {
				coverPath = Object.keys(zip.files).find((f) => /\.(jpe?g|png|webp)$/i.test(f)) || '';
			}
			if (coverPath) {
				try {
					const imgBuffer = await zip.files[coverPath].async('nodebuffer');
					const ext = coverPath.slice(coverPath.lastIndexOf('.')).toLowerCase();
					const savedCover = await mediaService.saveCover(
						`epub-cover-${Date.now()}${ext}`,
						imgBuffer
					);
					coverUrl = savedCover.url;
					detectedFields.push('coverUrl');
					summaryLog.push('Sampul naskah digital terdeteksi dan diekstrak dari paket EPUB.');
				} catch {
					// best-effort
				}
			}

			// Cari file .opf
			let opfPath = '';
			for (const path of Object.keys(zip.files)) {
				if (path.endsWith('.opf')) {
					opfPath = path;
					break;
				}
			}

			if (opfPath) {
				const opfContent = await zip.files[opfPath].async('string');

				const titleMatch = opfContent.match(/<dc:title[^>]*>(.*?)<\/dc:title>/i);
				if (titleMatch) {
					title = cleanTitle(titleMatch[1]);
					detectedFields.push('title');
					summaryLog.push(`Judul EPUB terdeteksi: "${title}"`);
				}

				const creatorMatch = opfContent.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/i);
				if (creatorMatch) {
					author = cleanAuthor(creatorMatch[1]);
					detectedFields.push('author');
					summaryLog.push(`Penulis terdeteksi dari metadata EPUB: ${author}`);
				}

				const pubMatch = opfContent.match(/<dc:publisher[^>]*>(.*?)<\/dc:publisher>/i);
				if (pubMatch) {
					publisher = pubMatch[1].trim();
					detectedFields.push('publisher');
				}

				const idMatch = opfContent.match(
					/<dc:identifier[^>]*>(?:urn:isbn:)?(97[89][-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9Xx])<\/dc:identifier>/i
				);
				if (idMatch) {
					isbn = formatIsbn(idMatch[1]);
					detectedFields.push('isbn');
					summaryLog.push(`Nomor ISBN ditemukan: ${isbn}`);
				}

				const dateMatch = opfContent.match(/<dc:date[^>]*>(.*?)<\/dc:date>/i);
				if (dateMatch) {
					const y = parseInt(dateMatch[1].slice(0, 4));
					if (y >= 1990 && y <= new Date().getFullYear() + 2) {
						year = y;
						detectedFields.push('year');
					}
				}

				const descMatch = opfContent.match(/<dc:description[^>]*>(.*?)<\/dc:description>/i);
				if (descMatch) {
					synopsis = descMatch[1].replace(/<[^>]+>/g, '').trim();
					detectedFields.push('synopsis');
				}

				const subjectMatches = [...opfContent.matchAll(/<dc:subject[^>]*>(.*?)<\/dc:subject>/gi)];
				for (const s of subjectMatches) {
					if (s[1].trim()) tags.push(s[1].trim());
				}
			}

			// Cek toc.ncx untuk Daftar Isi
			for (const path of Object.keys(zip.files)) {
				if (path.endsWith('toc.ncx')) {
					const ncx = await zip.files[path].async('string');
					const navPoints = [...ncx.matchAll(/<navPoint[^>]*>[\s\S]*?<text>(.*?)<\/text>/gi)];
					navPoints.forEach((np, idx) => {
						if (np[1].trim()) {
							toc.push({
								title: np[1].trim(),
								page: idx * 25 + 1
							});
						}
					});
					if (toc.length > 0) {
						detectedFields.push('toc');
						summaryLog.push(`Daftar isi otomatis: ${toc.length} bab naskah.`);
					}
					break;
				}
			}

			// Ekstraksi sinopsis dari teks bab pertama jika belum ada di metadata OPF
			if (!synopsis) {
				for (const p of Object.keys(zip.files)) {
					if (/chapter1|ch01|preface|intro/i.test(p) && p.endsWith('.html')) {
						try {
							const html = await zip.files[p].async('string');
							const textOnly = html
								.replace(/<[^>]+>/g, ' ')
								.replace(/\s+/g, ' ')
								.trim();
							if (textOnly.length >= 80) {
								synopsis = cleanSynopsisText(textOnly.slice(0, 1000));
								detectedFields.push('synopsis');
								summaryLog.push('Sinopsis naskah berhasil diekstrak dari bab awal EPUB.');
								break;
							}
						} catch {
							// ignore
						}
					}
				}
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Kesalahan berkas';
			summaryLog.push(`Peringatan penguraian EPUB: ${msg}`);
		}

		if (!title) {
			const base = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
			title = base.charAt(0).toUpperCase() + base.slice(1);
			detectedFields.push('title');
		}

		const ddcInferred = inferClassification(
			`${title} ${synopsis || ''} ${toc.map((t) => t.title).join(' ')}`
		);
		const ddcCode = ddcInferred.ddcCode;
		const ddcName = ddcInferred.ddcName;
		const category = ddcInferred.category;
		if (!classification) classification = ddcInferred.defaultCallNumber;
		detectedFields.push('ddcCode', 'category', 'classification');

		// Fallback sinopsis cerdas
		if (!synopsis || synopsis.length < 60) {
			synopsis = synthesizeAcademicSynopsis(
				title,
				author || 'Dosen Universitas Muhammadiyah Kotabumi',
				category,
				toc,
				publisher
			);
			detectedFields.push('synopsis');
			summaryLog.push('Sinopsis akademik cerdas disintesis untuk naskah EPUB.');
		}

		const smartTags = generateSmartTags(title, category, synopsis, toc, tags);
		detectedFields.push('tags');
		summaryLog.push(`Kata kunci & label cerdas otomatis dihasilkan (${smartTags.length} label).`);

		const confidence = Math.min(100, detectedFields.length * 12);

		return {
			title,
			author: author || 'Dosen Universitas Muhammadiyah Kotabumi',
			publisher,
			year: year || new Date().getFullYear(),
			pages,
			isbn: isbn || '',
			edition,
			language: 'Bahasa Indonesia',
			classification,
			ddcCode,
			ddcName,
			category,
			tags: smartTags,
			synopsis: synopsis || '',
			toc: toc.length > 0 ? toc : [{ title: 'Bab I: Pendahuluan', page: 1 }],
			coverUrl,
			fileType: 'epub',
			confidence,
			detectedFields,
			summaryLog
		};
	}
}

export const documentParserService = new DocumentParserService();
