import { readFile, writeFile, unlink, access, mkdir, readdir, stat } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { constants } from 'node:fs';
import { settingsService } from './settings.service';

const DEFAULT_BOOKS_DIR = join(process.cwd(), 'storage', 'books');
const DEFAULT_COVERS_DIR = join(process.cwd(), 'storage', 'covers');

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

function extractFileName(pathOrName: string): string {
	if (!pathOrName) return '';
	const segments = pathOrName.split(/[/\\]/);
	return segments[segments.length - 1]?.trim() || pathOrName.trim();
}

function sanitizeFileName(name: string): string {
	const base = extractFileName(name);
	return base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
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
	/**
	 * Dapatkan direktori penyimpanan yang aktif secara dinamis
	 * Berdasarkan konfigurasi storageDriver ('local' vs 'custom_local')
	 */
	async getStorageDirs(): Promise<{
		booksDir: string;
		coversDir: string;
		baseDir: string;
		isCustom: boolean;
	}> {
		try {
			const settings = await settingsService.getSettings();
			if (settings.storageDriver === 'custom_local' && settings.customStoragePath?.trim()) {
				const raw = settings.customStoragePath.trim();
				const baseDir = isAbsolute(raw) ? raw : join(process.cwd(), raw);
				const booksDir = join(baseDir, 'books');
				const coversDir = join(baseDir, 'covers');
				await mkdir(booksDir, { recursive: true });
				await mkdir(coversDir, { recursive: true });
				return { booksDir, coversDir, baseDir, isCustom: true };
			}
		} catch {
			// Fallback ke penyimpanan bawaan
		}

		await mkdir(DEFAULT_BOOKS_DIR, { recursive: true });
		await mkdir(DEFAULT_COVERS_DIR, { recursive: true });
		return {
			booksDir: DEFAULT_BOOKS_DIR,
			coversDir: DEFAULT_COVERS_DIR,
			baseDir: join(process.cwd(), 'storage'),
			isCustom: false
		};
	}

	/**
	 * Uji keterbacaan & izin tulis direktori penyimpanan
	 */
	async testStoragePath(targetPath: string): Promise<{
		success: boolean;
		message: string;
		resolvedPath: string;
		isWritable: boolean;
	}> {
		if (!targetPath?.trim()) {
			return {
				success: false,
				message: 'Jalur direktori tidak boleh kosong.',
				resolvedPath: '',
				isWritable: false
			};
		}

		const resolved = isAbsolute(targetPath.trim())
			? targetPath.trim()
			: join(process.cwd(), targetPath.trim());

		try {
			await mkdir(resolved, { recursive: true });
			const probeFile = join(resolved, `.probe_write_${Date.now()}.tmp`);
			await writeFile(probeFile, 'elibumko-storage-check');
			await unlink(probeFile);
			return {
				success: true,
				message:
					'Direktori penyimpanan valid dan dapat dibaca serta ditulis (Izin Read/Write Terverifikasi).',
				resolvedPath: resolved,
				isWritable: true
			};
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			return {
				success: false,
				message: `Tidak dapat mengakses atau menulis ke direktori "${resolved}": ${msg}`,
				resolvedPath: resolved,
				isWritable: false
			};
		}
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
		const { booksDir } = await this.getStorageDirs();

		const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
		if (!['.pdf', '.epub', '.docx', '.doc'].includes(ext)) {
			throw new Error('Format berkas dokumen tidak didukung. Gunakan .pdf, .docx, atau .epub');
		}

		let fileType: 'pdf' | 'epub' | 'docx' = 'pdf';
		if (ext === '.epub') fileType = 'epub';
		else if (ext === '.docx' || ext === '.doc') fileType = 'docx';

		const rawBase = fileName.replace(/\.[^/.]+$/, '');
		const safeName = `${sanitizeFileName(rawBase)}-${Date.now()}${ext}`;
		const filePath = join(booksDir, safeName);

		await writeFile(filePath, buffer);
		return {
			filePath,
			fileName: safeName,
			size: buffer.byteLength,
			fileType
		};
	}

	/**
	 * Resolusi berkas naskah buku secara presisi dan lintas platform (Linux & Windows).
	 * Hanya mencari berkas yang benar-benar milik buku yang diminta.
	 * TIDAK AKAN PERNAH mengembalikan berkas buku lain.
	 */
	async resolveBookFile(book: {
		slug: string;
		filePath?: string | null;
		fileType?: string | null;
		title?: string;
	}): Promise<{ fileName: string; fullPath: string; mimeType: string; size: number } | null> {
		const { booksDir } = await this.getStorageDirs();
		const candidateDirs = [booksDir];
		if (booksDir !== DEFAULT_BOOKS_DIR) {
			candidateDirs.push(DEFAULT_BOOKS_DIR);
		}

		// 1. Cek langsung filePath jika ada
		if (book.filePath?.trim()) {
			const rawPath = book.filePath.trim();
			// Absolute path
			if (isAbsolute(rawPath)) {
				try {
					const s = await stat(rawPath);
					if (s.isFile()) {
						return {
							fileName: extractFileName(rawPath),
							fullPath: rawPath,
							mimeType: getMimeType(rawPath),
							size: s.size
						};
					}
				} catch {
					// Abaikan jika tidak ada
				}
			}

			// Path relatif terhadap working directory
			const cwdPath = join(process.cwd(), rawPath);
			try {
				const s = await stat(cwdPath);
				if (s.isFile()) {
					return {
						fileName: extractFileName(rawPath),
						fullPath: cwdPath,
						mimeType: getMimeType(cwdPath),
						size: s.size
					};
				}
			} catch {
				// Abaikan jika tidak ada
			}
		}

		// 2. Kumpulkan kandidat nama berkas HANYA untuk buku ini
		const candidates: string[] = [];
		if (book.filePath?.trim()) {
			const rawBase = extractFileName(book.filePath.trim());
			if (rawBase) {
				candidates.push(rawBase);
				const safeBase = sanitizeFileName(rawBase);
				if (safeBase && safeBase !== rawBase) {
					candidates.push(safeBase);
				}
			}
		}

		const preferredExt = book.fileType ? `.${book.fileType.toLowerCase()}` : '.pdf';
		candidates.push(`${book.slug}${preferredExt}`);
		if (preferredExt !== '.pdf') candidates.push(`${book.slug}.pdf`);
		if (preferredExt !== '.epub') candidates.push(`${book.slug}.epub`);
		if (preferredExt !== '.docx') candidates.push(`${book.slug}.docx`);

		// Cek keberadaan berkas kandidat di direktori penyimpanan
		for (const dir of candidateDirs) {
			for (const cand of candidates) {
				const target = join(dir, cand);
				try {
					const s = await stat(target);
					if (s.isFile()) {
						return {
							fileName: cand,
							fullPath: target,
							mimeType: getMimeType(cand),
							size: s.size
						};
					}
				} catch {
					// Lanjutkan
				}
			}
		}

		// 3. Pindai folder secara case-insensitive atau prefix-match HANYA untuk naskah buku ini
		const slugLower = book.slug.toLowerCase();
		const rawBaseLower = book.filePath ? extractFileName(book.filePath).toLowerCase() : '';

		for (const dir of candidateDirs) {
			try {
				const files = await readdir(dir);
				for (const file of files) {
					const fileLower = file.toLowerCase();

					// Cocokkan persis case-insensitive
					const isExactMatch =
						(rawBaseLower && fileLower === rawBaseLower) ||
						candidates.some((c) => c.toLowerCase() === fileLower);

					// Atau cocokkan prefix jika berkas berawalan slug buku ini (misal: slug-12345.pdf)
					const isSlugPrefixMatch =
						fileLower.startsWith(`${slugLower}.`) || fileLower.startsWith(`${slugLower}-`);

					if (isExactMatch || isSlugPrefixMatch) {
						const fullPath = join(dir, file);
						const s = await stat(fullPath);
						if (s.isFile()) {
							return {
								fileName: file,
								fullPath,
								mimeType: getMimeType(file),
								size: s.size
							};
						}
					}
				}
			} catch {
				// Abaikan jika direktori tidak dapat dibaca
			}
		}

		// Berkas buku ini tidak ditemukan. Jangan pernah fallback ke buku lain!
		return null;
	}

	/**
	 * Ambil berkas dokumen buku
	 */
	async getDocument(
		fileName: string
	): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
		const { booksDir } = await this.getStorageDirs();
		const candidateDirs = [booksDir];
		if (booksDir !== DEFAULT_BOOKS_DIR) {
			candidateDirs.push(DEFAULT_BOOKS_DIR);
		}

		// 1. Jika path absolut langsung
		if (isAbsolute(fileName)) {
			try {
				await access(fileName, constants.R_OK);
				const buffer = await readFile(fileName);
				return {
					buffer,
					mimeType: getMimeType(fileName),
					size: buffer.byteLength
				};
			} catch {
				// Cek opsi lain
			}
		}

		// 2. Cek path relatif dari process.cwd()
		const cwdPath = join(process.cwd(), fileName);
		try {
			await access(cwdPath, constants.R_OK);
			const buffer = await readFile(cwdPath);
			return {
				buffer,
				mimeType: getMimeType(cwdPath),
				size: buffer.byteLength
			};
		} catch {
			// Cek opsi lain
		}

		// 3. Cek direktori books
		const raw = extractFileName(fileName);
		const safe = sanitizeFileName(raw);

		for (const dir of candidateDirs) {
			for (const cand of [raw, safe]) {
				if (!cand) continue;
				const target = join(dir, cand);
				try {
					await access(target, constants.R_OK);
					const buffer = await readFile(target);
					return {
						buffer,
						mimeType: getMimeType(cand),
						size: buffer.byteLength
					};
				} catch {
					// Lanjutkan
				}
			}
		}

		// 4. Case-insensitive lookup
		const rawLower = raw.toLowerCase();
		for (const dir of candidateDirs) {
			try {
				const files = await readdir(dir);
				for (const f of files) {
					if (f.toLowerCase() === rawLower) {
						const target = join(dir, f);
						const buffer = await readFile(target);
						return {
							buffer,
							mimeType: getMimeType(f),
							size: buffer.byteLength
						};
					}
				}
			} catch {
				// Lanjutkan
			}
		}

		throw new Error(`Berkas "${fileName}" tidak ditemukan dalam media storage.`);
	}

	/**
	 * Simpan sampul buku (JPG, PNG, WebP, AVIF)
	 */
	async saveCover(
		fileName: string,
		buffer: Buffer
	): Promise<{ url: string; fileName: string; size: number; mimeType: string }> {
		const { coversDir } = await this.getStorageDirs();

		const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
		if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
			throw new Error('Format berkas gambar tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.');
		}

		const rawBase = extractFileName(fileName).replace(/\.[^/.]+$/, '');
		const safeName = `cover-${sanitizeFileName(rawBase)}-${Date.now()}${ext}`;
		const filePath = join(coversDir, safeName);

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
		const { coversDir } = await this.getStorageDirs();
		const candidateDirs = [coversDir];
		if (coversDir !== DEFAULT_COVERS_DIR) {
			candidateDirs.push(DEFAULT_COVERS_DIR);
		}

		// 1. Direct absolute path
		if (isAbsolute(fileName)) {
			try {
				await access(fileName, constants.R_OK);
				const buffer = await readFile(fileName);
				return {
					buffer,
					mimeType: getMimeType(fileName),
					size: buffer.byteLength
				};
			} catch {
				// Lanjut
			}
		}

		// 2. Relative to process.cwd()
		const cwdPath = join(process.cwd(), fileName);
		try {
			await access(cwdPath, constants.R_OK);
			const buffer = await readFile(cwdPath);
			return {
				buffer,
				mimeType: getMimeType(cwdPath),
				size: buffer.byteLength
			};
		} catch {
			// Lanjut
		}

		// 3. Candidate dirs
		const raw = extractFileName(fileName);
		const safe = sanitizeFileName(raw);

		for (const dir of candidateDirs) {
			for (const cand of [raw, safe]) {
				if (!cand) continue;
				const target = join(dir, cand);
				try {
					await access(target, constants.R_OK);
					const buffer = await readFile(target);
					return {
						buffer,
						mimeType: getMimeType(cand),
						size: buffer.byteLength
					};
				} catch {
					// Lanjut
				}
			}
		}

		throw new Error(`Berkas sampul "${fileName}" tidak ditemukan.`);
	}

	/**
	 * Hapus berkas
	 */
	async deleteFile(type: 'book' | 'cover', fileName: string): Promise<boolean> {
		const { booksDir, coversDir } = await this.getStorageDirs();
		const dir = type === 'book' ? booksDir : coversDir;
		const defaultDir = type === 'book' ? DEFAULT_BOOKS_DIR : DEFAULT_COVERS_DIR;
		const candidateDirs = [dir];
		if (dir !== defaultDir) {
			candidateDirs.push(defaultDir);
		}

		const raw = extractFileName(fileName);
		const safe = sanitizeFileName(raw);

		for (const d of candidateDirs) {
			for (const cand of [raw, safe]) {
				if (!cand) continue;
				try {
					await unlink(join(d, cand));
					return true;
				} catch {
					// Lanjut
				}
			}
		}
		return false;
	}

	/**
	 * Cek keberadaan berkas
	 */
	async fileExists(type: 'book' | 'cover', fileName: string): Promise<boolean> {
		if (!fileName) return false;
		const { booksDir, coversDir } = await this.getStorageDirs();
		const dir = type === 'book' ? booksDir : coversDir;
		const defaultDir = type === 'book' ? DEFAULT_BOOKS_DIR : DEFAULT_COVERS_DIR;
		const candidateDirs = [dir];
		if (dir !== defaultDir) {
			candidateDirs.push(defaultDir);
		}

		// Direct absolute path
		if (isAbsolute(fileName)) {
			try {
				await access(fileName, constants.R_OK);
				return true;
			} catch {
				// Lanjut
			}
		}

		// Relative to process.cwd()
		try {
			await access(join(process.cwd(), fileName), constants.R_OK);
			return true;
		} catch {
			// Lanjut
		}

		const raw = extractFileName(fileName);
		const safe = sanitizeFileName(raw);

		for (const d of candidateDirs) {
			for (const cand of [raw, safe]) {
				if (!cand) continue;
				try {
					await access(join(d, cand), constants.R_OK);
					return true;
				} catch {
					// Lanjut
				}
			}
		}

		// Case-insensitive lookup
		const rawLower = raw.toLowerCase();
		for (const d of candidateDirs) {
			try {
				const files = await readdir(d);
				if (files.some((f) => f.toLowerCase() === rawLower)) {
					return true;
				}
			} catch {
				// Lanjut
			}
		}

		return false;
	}

	/**
	 * Hitung penggunaan storage riil pada disk server
	 */
	async getStorageUsage(limitGB = 50): Promise<StorageUsageReport> {
		const { booksDir, coversDir, isCustom } = await this.getStorageDirs();

		let pdfBytes = 0;
		let epubBytes = 0;
		let coverBytes = 0;
		let totalFiles = 0;
		const scannedPaths = new Set<string>();

		const scanDir = async (dir: string, isCover = false) => {
			try {
				const files = await readdir(dir);
				for (const file of files) {
					const fullPath = join(dir, file);
					if (scannedPaths.has(fullPath)) continue;
					scannedPaths.add(fullPath);

					const s = await stat(fullPath);
					if (s.isFile()) {
						totalFiles++;
						if (isCover) {
							coverBytes += s.size;
						} else {
							if (file.endsWith('.pdf')) pdfBytes += s.size;
							else if (file.endsWith('.epub')) epubBytes += s.size;
						}
					}
				}
			} catch {
				// Abaikan jika folder belum ada
			}
		};

		await scanDir(booksDir, false);
		await scanDir(coversDir, true);

		if (isCustom) {
			await scanDir(DEFAULT_BOOKS_DIR, false);
			await scanDir(DEFAULT_COVERS_DIR, true);
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

		// Deterministic theme selection based on title character hash
		const charCodeSum = (book.title || '')
			.split('')
			.reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const theme = themes[charCodeSum % themes.length];

		const safeTitle = (book.title || 'Koleksi Akademik')
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
