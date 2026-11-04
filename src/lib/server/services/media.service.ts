import { readFile, writeFile, unlink, access, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { constants } from 'node:fs';

const BOOKS_DIR = join(process.cwd(), 'storage', 'books');
const COVERS_DIR = join(process.cwd(), 'storage', 'covers');

const MIME_TYPES: Record<string, string> = {
	'.pdf': 'application/pdf',
	'.epub': 'application/epub+zip',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.doc': 'application/msword',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.svg': 'image/svg+xml'
};

function getMimeType(fileName: string): string {
	const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
	return MIME_TYPES[ext] ?? 'application/octet-stream';
}

function sanitizeFileName(name: string): string {
	return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

export interface StorageUsageReport {
	usedBytes: number;
	usedGB: number;
	limitGB: number;
	percent: number;
	pdfBytes: number;
	epubBytes: number;
	coverBytes: number;
	totalFiles: number;
}

class MediaService {
	private initialized = false;

	private async ensureDirs() {
		if (this.initialized) return;
		await mkdir(BOOKS_DIR, { recursive: true });
		await mkdir(COVERS_DIR, { recursive: true });
		this.initialized = true;
	}

	/**
	 * Simpan berkas dokumen buku (PDF, EPUB, atau DOCX)
	 */
	async saveDocument(
		fileName: string,
		buffer: Buffer
	): Promise<{
		filePath: string;
		fileName: string;
		size: number;
		fileType: 'pdf' | 'epub' | 'docx';
	}> {
		await this.ensureDirs();

		const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
		if (!['.pdf', '.epub', '.docx', '.doc'].includes(ext)) {
			throw new Error('Format berkas dokumen tidak didukung. Gunakan .pdf, .docx, atau .epub');
		}

		let fileType: 'pdf' | 'epub' | 'docx' = 'pdf';
		if (ext === '.epub') fileType = 'epub';
		else if (ext === '.docx' || ext === '.doc') fileType = 'docx';

		const rawBase = fileName.replace(/\.[^/.]+$/, '');
		const safeName = `${sanitizeFileName(rawBase)}-${Date.now()}${ext}`;
		const filePath = join(BOOKS_DIR, safeName);

		if (!filePath.startsWith(BOOKS_DIR)) {
			throw new Error('Upaya path traversal terdeteksi.');
		}

		await writeFile(filePath, buffer);
		return {
			filePath,
			fileName: safeName,
			size: buffer.byteLength,
			fileType
		};
	}

	/**
	 * Ambil berkas dokumen buku
	 */
	async getDocument(fileName: string): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
		await this.ensureDirs();
		const safe = sanitizeFileName(fileName);
		const filePath = join(BOOKS_DIR, safe);

		if (!filePath.startsWith(BOOKS_DIR)) {
			throw new Error('Upaya path traversal terdeteksi.');
		}

		const buffer = await readFile(filePath);
		return {
			buffer,
			mimeType: getMimeType(safe),
			size: buffer.byteLength
		};
	}

	/**
	 * Simpan sampul buku (JPG, PNG, WebP, AVIF)
	 */
	async saveCover(
		fileName: string,
		buffer: Buffer
	): Promise<{ url: string; fileName: string; size: number; mimeType: string }> {
		await this.ensureDirs();

		const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
		if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
			throw new Error('Format berkas gambar tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.');
		}

		const rawBase = fileName.replace(/\.[^/.]+$/, '');
		const safeName = `cover-${sanitizeFileName(rawBase)}-${Date.now()}${ext}`;
		const filePath = join(COVERS_DIR, safeName);

		if (!filePath.startsWith(COVERS_DIR)) {
			throw new Error('Upaya path traversal terdeteksi.');
		}

		await writeFile(filePath, buffer);
		return {
			url: `/api/covers/${safeName}`,
			fileName: safeName,
			size: buffer.byteLength,
			mimeType: getMimeType(safeName)
		};
	}

	/**
	 * Ambil sampul buku dari storage
	 */
	async getCover(fileName: string): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
		await this.ensureDirs();
		const safe = sanitizeFileName(fileName);
		const filePath = join(COVERS_DIR, safe);

		if (!filePath.startsWith(COVERS_DIR)) {
			throw new Error('Upaya path traversal terdeteksi.');
		}

		const buffer = await readFile(filePath);
		return {
			buffer,
			mimeType: getMimeType(safe),
			size: buffer.byteLength
		};
	}

	/**
	 * Hapus berkas
	 */
	async deleteFile(type: 'book' | 'cover', fileName: string): Promise<boolean> {
		await this.ensureDirs();
		const dir = type === 'book' ? BOOKS_DIR : COVERS_DIR;
		const safe = sanitizeFileName(fileName);
		const filePath = join(dir, safe);

		if (!filePath.startsWith(dir)) return false;

		try {
			await unlink(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Cek keberadaan berkas
	 */
	async fileExists(type: 'book' | 'cover', fileName: string): Promise<boolean> {
		await this.ensureDirs();
		const dir = type === 'book' ? BOOKS_DIR : COVERS_DIR;
		const safe = sanitizeFileName(fileName);
		const filePath = join(dir, safe);

		if (!filePath.startsWith(dir)) return false;

		try {
			await access(filePath, constants.R_OK);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Hitung penggunaan storage riil pada disk server
	 */
	async getStorageUsage(limitGB = 50): Promise<StorageUsageReport> {
		await this.ensureDirs();

		let pdfBytes = 0;
		let epubBytes = 0;
		let coverBytes = 0;
		let totalFiles = 0;

		try {
			const bookFiles = await readdir(BOOKS_DIR);
			for (const file of bookFiles) {
				const s = await stat(join(BOOKS_DIR, file));
				if (s.isFile()) {
					totalFiles++;
					if (file.endsWith('.pdf')) pdfBytes += s.size;
					else if (file.endsWith('.epub')) epubBytes += s.size;
				}
			}
		} catch {
			// ignore directory reading errors
		}

		try {
			const coverFiles = await readdir(COVERS_DIR);
			for (const file of coverFiles) {
				const s = await stat(join(COVERS_DIR, file));
				if (s.isFile()) {
					totalFiles++;
					coverBytes += s.size;
				}
			}
		} catch {
			// ignore directory reading errors
		}

		const usedBytes = pdfBytes + epubBytes + coverBytes;
		const usedGB = Number((usedBytes / (1024 * 1024 * 1024)).toFixed(2));
		const percent = Math.min(100, Number(((usedGB / limitGB) * 100).toFixed(1)));

		return {
			usedBytes,
			usedGB,
			limitGB,
			percent,
			pdfBytes,
			epubBytes,
			coverBytes,
			totalFiles
		};
	}

	/**
	 * Generator sampul SVG dinamis untuk buku yang belum memiliki file sampul kustom.
	 * Menghasilkan sampul editorial akademis beresolusi tinggi dengan palet UMKO.
	 */
	generateDynamicCover(book: {
		title: string;
		author?: string | null;
		classification?: string | null;
		category?: string | null;
	}): string {
		const themes = [
			{ bg: '#9A3B3B', text: '#F2ECBE', accent: '#E2C799', tag: '#2A1A16' }, // Brick
			{ bg: '#2A1A16', text: '#F2ECBE', accent: '#C08261', tag: '#9A3B3B' }, // Ink
			{ bg: '#C08261', text: '#F2ECBE', accent: '#F2ECBE', tag: '#2A1A16' }, // Terracotta
			{ bg: '#E2C799', text: '#2A1A16', accent: '#9A3B3B', tag: '#C08261' } // Sand
		];

		let hash = 0;
		for (let i = 0; i < (book.title || '').length; i++) {
			hash = (hash << 5) - hash + book.title.charCodeAt(i);
			hash |= 0;
		}
		const theme = themes[Math.abs(hash) % themes.length];

		// Truncate and escape title
		const safeTitle = (book.title || 'Koleksi Perpustakaan')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		const safeAuthor = (book.author || 'Civitas Akademika UMKO')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		const safeClass = (book.classification || '000')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		const safeCategory = (book.category || 'Monograf Akademik')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		// Wrap title into up to 3 lines
		const words = safeTitle.split(' ');
		const lines: string[] = [];
		let currentLine = '';
		for (const w of words) {
			if ((currentLine + ' ' + w).trim().length > 22) {
				if (lines.length < 3) lines.push(currentLine.trim());
				currentLine = w;
			} else {
				currentLine = (currentLine + ' ' + w).trim();
			}
		}
		if (currentLine && lines.length < 3) lines.push(currentLine);

		const titleSpans = lines
			.map(
				(l, i) =>
					`<tspan x="36" dy="${i === 0 ? 0 : 28}" font-family="Georgia, serif" font-weight="bold" font-size="20">${l}</tspan>`
			)
			.join('');

		return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480" width="320" height="480">
	<defs>
		<linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" stop-color="#000" stop-opacity="0.35"/>
			<stop offset="3%" stop-color="#fff" stop-opacity="0.15"/>
			<stop offset="6%" stop-color="#000" stop-opacity="0.15"/>
			<stop offset="100%" stop-color="#000" stop-opacity="0"/>
		</linearGradient>
		<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
			<circle cx="2" cy="2" r="0.75" fill="${theme.accent}" opacity="0.15"/>
		</pattern>
	</defs>

	<!-- Book cover background -->
	<rect width="320" height="480" fill="${theme.bg}"/>
	<rect width="320" height="480" fill="url(#grid)"/>

	<!-- Inner border frame -->
	<rect x="18" y="18" width="284" height="444" fill="none" stroke="${theme.accent}" stroke-width="1.5" stroke-opacity="0.4"/>
	<rect x="22" y="22" width="276" height="436" fill="none" stroke="${theme.accent}" stroke-width="0.75" stroke-opacity="0.25"/>

	<!-- Header: Institution & Classification -->
	<text x="36" y="52" fill="${theme.text}" opacity="0.7" font-family="'Source Sans 3', sans-serif" font-size="9" letter-spacing="1.5" font-weight="600">
		UNIVERSITAS MUHAMMADIYAH KOTABUMI
	</text>

	<rect x="36" y="66" width="60" height="18" rx="2" fill="${theme.tag}" fill-opacity="0.6"/>
	<text x="44" y="79" fill="${theme.text}" font-family="monospace" font-size="10" font-weight="bold">
		DDC ${safeClass}
	</text>

	<!-- Title -->
	<text x="36" y="140" fill="${theme.text}">
		${titleSpans}
	</text>

	<!-- Decorative divider -->
	<line x1="36" y1="260" x2="110" y2="260" stroke="${theme.accent}" stroke-width="2"/>

	<!-- Author -->
	<text x="36" y="295" fill="${theme.text}" opacity="0.9" font-family="'Source Sans 3', sans-serif" font-size="13" font-weight="600">
		${safeAuthor}
	</text>

	<!-- Category Badge -->
	<text x="36" y="320" fill="${theme.accent}" font-family="'Source Sans 3', sans-serif" font-size="11">
		${safeCategory}
	</text>

	<!-- Footer emblem -->
	<circle cx="160" cy="410" r="14" fill="none" stroke="${theme.accent}" stroke-width="1.5" stroke-opacity="0.5"/>
	<text x="160" y="414" fill="${theme.text}" font-family="Georgia, serif" font-size="10" font-weight="bold" text-anchor="middle">
		UM
	</text>

	<!-- Spine 3D shading -->
	<rect width="24" height="480" fill="url(#spine)"/>
</svg>`;
	}
}

export const mediaService = new MediaService();
