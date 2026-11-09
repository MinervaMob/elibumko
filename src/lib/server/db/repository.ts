import { db } from './index';
import * as schema from './schema';
import { eq, desc, and, isNull, like, or, sql } from 'drizzle-orm';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
	BookData,
	CategoryData,
	ClassificationNode,
	TableOfContentItem,
	ActivityLogItem,
	SearchLogItem,
	LibrarySettings,
	LibrarianProfile,
	LogStats,
	ReadingSessionRecord
} from '#lib/types';
import {
	INITIAL_BOOKS,
	INITIAL_DDC_TREE,
	INITIAL_CATEGORIES,
	INITIAL_ACTIVITY_LOGS,
	INITIAL_SEARCH_LOGS,
	INITIAL_ZERO_SEARCH_LOGS,
	INITIAL_LIBRARY_SETTINGS,
	INITIAL_LIBRARIAN_PROFILE
} from './seed-data';
import { DEFAULT_LIBRARIAN } from '../auth-constants';

// Maximum capacity for rolling FIFO activity log to ensure lightweight storage
const MAX_ACTIVITY_LOGS = 500;

// Persistent Local Data Directory for Offline On-Premise Operation
const DATA_DIR = join(process.cwd(), 'storage', 'data');

function ensureDataDir(): void {
	if (!existsSync(DATA_DIR)) {
		try {
			mkdirSync(DATA_DIR, { recursive: true });
		} catch {
			// ignore
		}
	}
}

function initPersistedData<T>(fileName: string, fallback: T): T {
	try {
		ensureDataDir();
		const filePath = join(DATA_DIR, fileName);
		if (existsSync(filePath)) {
			const raw = readFileSync(filePath, 'utf-8');
			return JSON.parse(raw) as T;
		}
		savePersistedData(fileName, fallback);
	} catch (e) {
		console.warn(`[StorageEngine] Failed reading ${fileName}, using fallback:`, e);
	}
	return fallback;
}

function savePersistedData<T>(fileName: string, data: T): void {
	try {
		ensureDataDir();
		const filePath = join(DATA_DIR, fileName);
		writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
	} catch (e) {
		console.error(`[StorageEngine] Failed writing ${fileName}:`, e);
	}
}

interface PersistedLibrarianRecord {
	profile?: LibrarianProfile;
	password?: string;
	name?: string;
}

const savedLibrarian = initPersistedData<PersistedLibrarianRecord>('librarian.json', {
	profile: { ...INITIAL_LIBRARIAN_PROFILE },
	password: DEFAULT_LIBRARIAN.password
});

// Persistent state initialized from disk (survives hard refresh & server restarts)
let inMemoryLibrarian: LibrarianProfile =
	savedLibrarian?.profile &&
	typeof savedLibrarian.profile === 'object' &&
	savedLibrarian.profile.name
		? savedLibrarian.profile
		: savedLibrarian?.name
			? (savedLibrarian as unknown as LibrarianProfile)
			: { ...INITIAL_LIBRARIAN_PROFILE };

let inMemoryLibrarianPassword: string = savedLibrarian?.password || DEFAULT_LIBRARIAN.password;

let inMemoryBooks: BookData[] = initPersistedData<BookData[]>('books.json', [...INITIAL_BOOKS]);
const inMemoryDdcTree: ClassificationNode[] = initPersistedData<ClassificationNode[]>(
	'classifications.json',
	JSON.parse(JSON.stringify(INITIAL_DDC_TREE))
);
const inMemoryActivities: ActivityLogItem[] = initPersistedData<ActivityLogItem[]>(
	'activities.json',
	[...INITIAL_ACTIVITY_LOGS]
);
const inMemorySearchLogs: SearchLogItem[] = initPersistedData<SearchLogItem[]>('searches.json', [
	...INITIAL_SEARCH_LOGS
]);
const inMemoryZeroSearchLogs: SearchLogItem[] = initPersistedData<SearchLogItem[]>(
	'searches_zero.json',
	[...INITIAL_ZERO_SEARCH_LOGS]
);
const inMemoryReadingSessions: ReadingSessionRecord[] = initPersistedData<ReadingSessionRecord[]>(
	'sessions.json',
	[]
);
let inMemorySettings: LibrarySettings = initPersistedData<LibrarySettings>('settings.json', {
	...INITIAL_LIBRARY_SETTINGS
});

// Circuit Breaker: Cache DB offline status so queries fail-over immediately without socket timeouts
let isPostgresAvailable: boolean | null = null;
let lastDbCheck = 0;
const DB_CHECK_INTERVAL = 30000;

export async function isDbOnline(): Promise<boolean> {
	const now = Date.now();
	if (isPostgresAvailable !== null && now - lastDbCheck < DB_CHECK_INTERVAL) {
		return isPostgresAvailable;
	}
	lastDbCheck = now;
	try {
		await Promise.race([
			db.execute(sql`SELECT 1`),
			new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
		]);
		isPostgresAvailable = true;
	} catch {
		isPostgresAvailable = false;
	}
	return isPostgresAvailable;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '');
}

export const repository = {
	async getBooks(options?: {
		search?: string;
		category?: string;
		ddcCode?: string;
		includeDeleted?: boolean;
	}): Promise<BookData[]> {
		try {
			const conditions = [];
			if (!options?.includeDeleted) {
				conditions.push(isNull(schema.books.deletedAt));
			}
			if (options?.category && options.category !== 'Semua') {
				conditions.push(eq(schema.books.category, options.category));
			}
			if (options?.ddcCode) {
				conditions.push(eq(schema.books.ddcCode, options.ddcCode));
			}
			if (options?.search?.trim()) {
				const q = `%${options.search.trim().toLowerCase()}%`;
				conditions.push(
					or(
						like(schema.books.title, q),
						like(schema.books.author, q),
						like(schema.books.classification, q)
					)
				);
			}

			const results = await db
				.select()
				.from(schema.books)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(schema.books.createdAt));

			if (results.length > 0) {
				return results.map((r) => ({
					...r,
					id: r.id,
					year: r.year ?? undefined,
					pages: r.pages ?? undefined,
					fileType: r.fileType ?? 'pdf',
					isFeatured: r.isFeatured ?? false,
					tags: (r.tags as string[]) ?? [],
					toc: (r.toc as TableOfContentItem[]) ?? [],
					createdAt: r.createdAt.toISOString()
				}));
			}
		} catch {
			// Fallback to in-memory store
		}

		// Return from in-memory store
		return inMemoryBooks.filter((b) => {
			const matchQ =
				!options?.search?.trim() ||
				b.title.toLowerCase().includes(options.search.toLowerCase()) ||
				b.author.toLowerCase().includes(options.search.toLowerCase()) ||
				(b.classification && b.classification.includes(options.search));
			const matchC =
				!options?.category || options.category === 'Semua' || b.category === options.category;
			const matchD = !options?.ddcCode || b.ddcCode === options.ddcCode;
			return matchQ && matchC && matchD;
		});
	},

	async getBookBySlug(slug: string): Promise<BookData | null> {
		try {
			const results = await db
				.select()
				.from(schema.books)
				.where(and(eq(schema.books.slug, slug), isNull(schema.books.deletedAt)))
				.limit(1);

			if (results.length > 0) {
				const r = results[0];
				return {
					...r,
					id: r.id,
					year: r.year ?? undefined,
					pages: r.pages ?? undefined,
					fileType: r.fileType ?? 'pdf',
					isFeatured: r.isFeatured ?? false,
					tags: (r.tags as string[]) ?? [],
					toc: (r.toc as TableOfContentItem[]) ?? [],
					createdAt: r.createdAt.toISOString()
				};
			}
		} catch {
			// Fallback
		}

		return inMemoryBooks.find((b) => b.slug === slug) ?? null;
	},

	async createBook(data: {
		title: string;
		author: string;
		publisher?: string;
		year?: number;
		edition?: string;
		isbn?: string;
		pages?: number;
		language?: string;
		classification?: string;
		ddcCode?: string;
		ddcName?: string;
		category?: string;
		tags?: string[];
		synopsis?: string;
		toc?: TableOfContentItem[];
		isFeatured?: boolean;
		fileType?: 'pdf' | 'epub' | 'docx';
		filePath?: string;
		fileSize?: number;
		coverUrl?: string | null;
	}): Promise<BookData> {
		const slug = slugify(data.title) + '-' + Math.random().toString(36).slice(2, 6);

		try {
			const [inserted] = await db
				.insert(schema.books)
				.values({
					title: data.title,
					slug,
					author: data.author,
					publisher: data.publisher,
					year: data.year,
					edition: data.edition,
					isbn: data.isbn,
					pages: data.pages,
					language: data.language ?? 'Bahasa Indonesia',
					coverUrl: data.coverUrl,
					classification: data.classification,
					ddcCode: data.ddcCode,
					ddcName: data.ddcName,
					category: data.category,
					tags: data.tags ?? [],
					synopsis: data.synopsis,
					toc: data.toc ?? [],
					isFeatured: data.isFeatured ?? false,
					fileType: data.fileType ?? 'pdf',
					filePath: data.filePath,
					fileSize: data.fileSize
				})
				.returning();

			if (inserted) {
				const created: BookData = {
					...inserted,
					id: inserted.id,
					year: inserted.year ?? undefined,
					pages: inserted.pages ?? undefined,
					fileType: inserted.fileType ?? 'pdf',
					tags: (inserted.tags as string[]) ?? [],
					toc: (inserted.toc as TableOfContentItem[]) ?? [],
					createdAt: inserted.createdAt.toISOString()
				};
				// Keep in-memory store in sync
				inMemoryBooks.unshift(created);
				savePersistedData('books.json', inMemoryBooks);
				return created;
			}
		} catch {
			// Fallback
		}

		const newBook: BookData = {
			id: Date.now(),
			slug,
			readersCount: 0,
			createdAt: new Date().toISOString().split('T')[0],
			...data
		};
		inMemoryBooks.unshift(newBook);
		savePersistedData('books.json', inMemoryBooks);
		return newBook;
	},

	async updateBook(slug: string, updates: Partial<BookData>): Promise<BookData | null> {
		try {
			const [updated] = await db
				.update(schema.books)
				.set({
					title: updates.title,
					author: updates.author,
					publisher: updates.publisher,
					year: typeof updates.year === 'number' ? updates.year : undefined,
					edition: updates.edition,
					isbn: updates.isbn,
					pages: updates.pages,
					language: updates.language,
					classification: updates.classification,
					ddcCode: updates.ddcCode,
					ddcName: updates.ddcName,
					category: updates.category,
					tags: updates.tags,
					synopsis: updates.synopsis,
					toc: updates.toc,
					isFeatured: updates.isFeatured,
					fileType: updates.fileType,
					filePath: updates.filePath,
					fileSize: updates.fileSize,
					coverUrl: updates.coverUrl,
					updatedAt: new Date()
				})
				.where(eq(schema.books.slug, slug))
				.returning();

			if (updated) {
				const res: BookData = {
					...updated,
					id: updated.id,
					year: updated.year ?? undefined,
					pages: updated.pages ?? undefined,
					fileType: updated.fileType ?? 'pdf',
					tags: (updated.tags as string[]) ?? [],
					toc: (updated.toc as TableOfContentItem[]) ?? [],
					createdAt: updated.createdAt.toISOString()
				};
				const idx = inMemoryBooks.findIndex((b) => b.slug === slug);
				if (idx !== -1) inMemoryBooks[idx] = res;
				savePersistedData('books.json', inMemoryBooks);
				return res;
			}
		} catch {
			// Fallback
		}

		const idx = inMemoryBooks.findIndex((b) => b.slug === slug);
		if (idx !== -1) {
			inMemoryBooks[idx] = { ...inMemoryBooks[idx], ...updates };
			savePersistedData('books.json', inMemoryBooks);
			return inMemoryBooks[idx];
		}
		return null;
	},

	async deleteBook(slug: string): Promise<boolean> {
		try {
			await db
				.update(schema.books)
				.set({ deletedAt: new Date() })
				.where(eq(schema.books.slug, slug));
		} catch {
			// Fallback
		}

		const initialLen = inMemoryBooks.length;
		inMemoryBooks = inMemoryBooks.filter((b) => b.slug !== slug);
		if (inMemoryBooks.length < initialLen) {
			savePersistedData('books.json', inMemoryBooks);
			return true;
		}
		return false;
	},

	async getActivityLogs(): Promise<ActivityLogItem[]> {
		try {
			const logs = await db
				.select()
				.from(schema.activityLogs)
				.orderBy(desc(schema.activityLogs.createdAt))
				.limit(20);

			if (logs.length > 0) {
				return logs.map((l) => ({
					id: l.id,
					action: l.action as ActivityLogItem['action'],
					description: l.description,
					targetTitle: l.targetTitle ?? undefined,
					targetSlug: l.targetSlug ?? undefined,
					userName: l.userName,
					timestamp: l.createdAt.toLocaleTimeString('id-ID', {
						hour: '2-digit',
						minute: '2-digit'
					})
				}));
			}
		} catch {
			// Fallback
		}
		return inMemoryActivities;
	},

	async addActivityLog(
		action: ActivityLogItem['action'],
		description: string,
		targetTitle?: string,
		targetSlug?: string,
		userName?: string
	): Promise<void> {
		const effectiveUserName = userName || inMemoryLibrarian.name || 'Pustakawan';
		const newLog: ActivityLogItem = {
			id: 'act-' + Date.now(),
			action,
			description,
			targetTitle,
			targetSlug,
			userName: effectiveUserName,
			timestamp: 'Baru saja'
		};
		inMemoryActivities.unshift(newLog);
		if (inMemoryActivities.length > MAX_ACTIVITY_LOGS) {
			inMemoryActivities.length = MAX_ACTIVITY_LOGS;
		}
		savePersistedData('activities.json', inMemoryActivities);

		try {
			await db.insert(schema.activityLogs).values({
				id: newLog.id,
				action,
				description,
				targetTitle,
				targetSlug,
				userName: effectiveUserName
			});

			// Rolling window: Prune logs exceeding MAX_ACTIVITY_LOGS from database
			await db.execute(
				sql`DELETE FROM activity_logs WHERE id NOT IN (
					SELECT id FROM activity_logs ORDER BY created_at DESC LIMIT ${MAX_ACTIVITY_LOGS}
				)`
			);
		} catch {
			// Ignore if DB is offline
		}
	},

	async incrementReaders(slug: string): Promise<void> {
		try {
			await db
				.update(schema.books)
				.set({ readersCount: sql`${schema.books.readersCount} + 1` })
				.where(eq(schema.books.slug, slug));
		} catch {
			// Ignore if DB offline
		}
		const book = inMemoryBooks.find((b) => b.slug === slug);
		if (book) {
			book.readersCount = (book.readersCount || 0) + 1;
			savePersistedData('books.json', inMemoryBooks);
		}
	},

	async recordReadingSession(params: {
		bookSlug: string;
		deviceHash: string;
		role?: 'mahasiswa' | 'dosen' | 'umum';
		pagesRead?: number;
	}): Promise<{ isNewSession: boolean }> {
		const THIRTY_MINUTES_MS = 30 * 60 * 1000;
		const now = new Date();

		// Check if active session exists for this device & book in sliding 30-min window
		const existing = inMemoryReadingSessions.find(
			(s) =>
				s.bookSlug === params.bookSlug &&
				s.deviceHash === params.deviceHash &&
				now.getTime() - new Date(s.lastActivityAt).getTime() < THIRTY_MINUTES_MS
		);

		if (existing) {
			existing.lastActivityAt = now.toISOString();
			if (params.pagesRead && params.pagesRead > existing.pagesRead) {
				existing.pagesRead = params.pagesRead;
			}
			if (params.role && params.role !== 'umum') {
				existing.role = params.role;
			}
			savePersistedData('sessions.json', inMemoryReadingSessions);
			return { isNewSession: false };
		}

		// New reading session
		const newSession: ReadingSessionRecord = {
			id: 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
			bookSlug: params.bookSlug,
			deviceHash: params.deviceHash,
			role: params.role || 'umum',
			pagesRead: params.pagesRead || 1,
			createdAt: now.toISOString(),
			lastActivityAt: now.toISOString()
		};

		inMemoryReadingSessions.unshift(newSession);
		if (inMemoryReadingSessions.length > 1000) {
			inMemoryReadingSessions.length = 1000;
		}
		savePersistedData('sessions.json', inMemoryReadingSessions);

		// Increment book reader view count
		await this.incrementReaders(params.bookSlug);

		try {
			await db.insert(schema.readingSessions).values({
				id: newSession.id,
				bookSlug: newSession.bookSlug,
				deviceHash: newSession.deviceHash,
				role: newSession.role,
				pagesRead: newSession.pagesRead,
				createdAt: now,
				lastActivityAt: now
			});
		} catch {
			// DB fallback
		}

		return { isNewSession: true };
	},

	async getReadingSessions(): Promise<ReadingSessionRecord[]> {
		try {
			const rows = await db
				.select()
				.from(schema.readingSessions)
				.orderBy(desc(schema.readingSessions.createdAt))
				.limit(1000);

			if (rows.length > 0) {
				return rows.map((r) => ({
					id: r.id,
					bookSlug: r.bookSlug,
					deviceHash: r.deviceHash,
					role: r.role,
					pagesRead: r.pagesRead,
					createdAt: r.createdAt.toISOString(),
					lastActivityAt: r.lastActivityAt.toISOString()
				}));
			}
		} catch {
			// DB fallback
		}

		// If in-memory is empty but we have books with readersCount, generate consistent sessions
		if (inMemoryReadingSessions.length === 0) {
			const books = await this.getBooks();
			const now = new Date();
			books.forEach((b, bIdx) => {
				const count = Math.min(b.readersCount || 0, 15);
				for (let i = 0; i < count; i++) {
					const dayOffset = i % 7;
					const sessDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
					inMemoryReadingSessions.push({
						id: `seed-sess-${b.slug}-${i}`,
						bookSlug: b.slug,
						deviceHash: `dev-${(bIdx * 5 + i) % 6}`,
						role: i % 3 === 0 ? 'dosen' : i % 3 === 1 ? 'mahasiswa' : 'umum',
						pagesRead: 4 + (i % 8),
						createdAt: sessDate.toISOString(),
						lastActivityAt: sessDate.toISOString()
					});
				}
			});
			savePersistedData('sessions.json', inMemoryReadingSessions);
		}

		return inMemoryReadingSessions;
	},

	async updateSessionRole(deviceHash: string, role: 'mahasiswa' | 'dosen' | 'umum'): Promise<void> {
		for (const s of inMemoryReadingSessions) {
			if (s.deviceHash === deviceHash) {
				s.role = role;
			}
		}
		savePersistedData('sessions.json', inMemoryReadingSessions);
		try {
			await db
				.update(schema.readingSessions)
				.set({ role })
				.where(eq(schema.readingSessions.deviceHash, deviceHash));
		} catch {
			// DB fallback
		}
	},

	async getCategories(): Promise<CategoryData[]> {
		const allBooks = await this.getBooks();
		return INITIAL_CATEGORIES.map((cat) => {
			const count = allBooks.filter(
				(b) => b.category === cat.name || b.ddcCode === cat.code
			).length;
			return {
				...cat,
				count
			};
		});
	},

	async getDdcTree(): Promise<ClassificationNode[]> {
		const allBooks = await this.getBooks();

		try {
			const rows = await db
				.select()
				.from(schema.classifications)
				.orderBy(schema.classifications.sortOrder, schema.classifications.code);

			if (rows.length > 0) {
				const mainNodes = rows.filter((r) => !r.parentCode);
				const subNodes = rows.filter((r) => !!r.parentCode);

				return mainNodes.map((main) => {
					const nodeBooks = allBooks.filter(
						(b) =>
							b.ddcCode === main.code ||
							(b.classification && b.classification.startsWith(main.code))
					);
					const children = subNodes
						.filter((s) => s.parentCode === main.code)
						.map((sub) => {
							const subBooks = allBooks.filter(
								(b) =>
									b.classification === sub.code ||
									(b.classification && b.classification.startsWith(sub.code))
							);
							return {
								code: sub.code,
								name: sub.name,
								count: subBooks.length
							};
						});

					return {
						code: main.code,
						name: main.name,
						description: main.description ?? undefined,
						color: (main.color as 'brick' | 'terracotta' | 'sand' | 'ink') || 'brick',
						count: nodeBooks.length,
						isCustom: ![
							'000',
							'100',
							'200',
							'300',
							'400',
							'500',
							'600',
							'700',
							'800',
							'900'
						].includes(main.code),
						subclasses: children
					};
				});
			}
		} catch {
			// Fallback to in-memory tree
		}

		return inMemoryDdcTree.map((node) => {
			const nodeBooks = allBooks.filter(
				(b) =>
					b.ddcCode === node.code || (b.classification && b.classification.startsWith(node.code))
			);
			const subclasses = (node.subclasses || []).map((sub) => {
				const subBooks = allBooks.filter(
					(b) =>
						b.classification === sub.code ||
						(b.classification && b.classification.startsWith(sub.code))
				);
				return {
					...sub,
					count: subBooks.length
				};
			});
			return {
				...node,
				count: nodeBooks.length,
				subclasses
			};
		});
	},

	async addClassification(data: {
		code: string;
		name: string;
		description?: string;
		color?: 'brick' | 'terracotta' | 'sand' | 'ink';
		parentCode?: string;
		isCustom?: boolean;
	}): Promise<{ success: boolean; message: string }> {
		const cleanCode = data.code.trim().toUpperCase();
		const cleanName = data.name.trim();
		if (!cleanCode || !cleanName) {
			return { success: false, message: 'Kode dan nama klasifikasi wajib diisi.' };
		}

		// 1. If adding Sub-classification
		if (data.parentCode) {
			const parent = inMemoryDdcTree.find((n) => n.code === data.parentCode);
			if (!parent) {
				return {
					success: false,
					message: `Divisi klasifikasi induk (${data.parentCode}) tidak ditemukan.`
				};
			}
			if (!parent.subclasses) parent.subclasses = [];
			const exists = parent.subclasses.some((s) => s.code === cleanCode);
			if (exists) {
				return {
					success: false,
					message: `Sub-klasifikasi dengan kode ${cleanCode} sudah terdaftar.`
				};
			}

			parent.subclasses.push({
				code: cleanCode,
				name: cleanName,
				count: 0
			});
			savePersistedData('classifications.json', inMemoryDdcTree);

			try {
				await db
					.insert(schema.classifications)
					.values({
						code: cleanCode,
						name: cleanName,
						description: data.description,
						color: data.color || 'brick',
						parentCode: data.parentCode,
						count: 0
					})
					.onConflictDoUpdate({
						target: schema.classifications.code,
						set: { name: cleanName, description: data.description }
					});
			} catch {
				// DB fallback
			}

			await this.addActivityLog(
				'system',
				`Menambahkan sub-klasifikasi baru: [${cleanCode}] ${cleanName} pada divisi ${data.parentCode}`
			);
			return { success: true, message: `Sub-klasifikasi ${cleanCode} berhasil ditambahkan.` };
		}

		// 2. If adding Main Classification / Special Campus Collection
		const exists = inMemoryDdcTree.some((n) => n.code === cleanCode);
		if (exists) {
			return {
				success: false,
				message: `Klasifikasi utama dengan kode ${cleanCode} sudah terdaftar.`
			};
		}

		const newNode: ClassificationNode = {
			code: cleanCode,
			name: cleanName,
			description: data.description || `Koleksi klasifikasi ${cleanName}`,
			color: data.color || 'brick',
			count: 0,
			isCustom: data.isCustom ?? true,
			subclasses: []
		};
		inMemoryDdcTree.push(newNode);
		savePersistedData('classifications.json', inMemoryDdcTree);

		try {
			await db
				.insert(schema.classifications)
				.values({
					code: cleanCode,
					name: cleanName,
					description: data.description,
					color: data.color || 'brick',
					parentCode: null,
					count: 0,
					sortOrder: 50
				})
				.onConflictDoUpdate({
					target: schema.classifications.code,
					set: { name: cleanName, description: data.description }
				});
		} catch {
			// DB fallback
		}

		await this.addActivityLog(
			'system',
			`Menambahkan klasifikasi utama/koleksi khusus: [${cleanCode}] ${cleanName}`
		);
		return {
			success: true,
			message: `Klasifikasi ${cleanCode} — ${cleanName} berhasil ditambahkan.`
		};
	},

	async updateClassification(
		code: string,
		updates: { name: string; description?: string; color?: 'brick' | 'terracotta' | 'sand' | 'ink' }
	): Promise<{ success: boolean; message: string }> {
		const cleanCode = code.trim().toUpperCase();
		const cleanName = updates.name.trim();
		if (!cleanName) return { success: false, message: 'Nama klasifikasi wajib diisi.' };

		// Check if it's a main node
		const mainNode = inMemoryDdcTree.find((n) => n.code === cleanCode);
		if (mainNode) {
			mainNode.name = cleanName;
			if (updates.description !== undefined) mainNode.description = updates.description;
			if (updates.color) mainNode.color = updates.color;
		} else {
			// Check if it's a subclass
			let foundSub = false;
			for (const p of inMemoryDdcTree) {
				const sub = p.subclasses?.find((s) => s.code === cleanCode);
				if (sub) {
					sub.name = cleanName;
					foundSub = true;
					break;
				}
			}
			if (!foundSub) {
				return { success: false, message: `Klasifikasi ${cleanCode} tidak ditemukan.` };
			}
		}
		savePersistedData('classifications.json', inMemoryDdcTree);

		try {
			await db
				.update(schema.classifications)
				.set({
					name: cleanName,
					description: updates.description,
					color: updates.color
				})
				.where(eq(schema.classifications.code, cleanCode));
		} catch {
			// DB fallback
		}

		await this.addActivityLog(
			'update',
			`Memperbarui data klasifikasi: [${cleanCode}] ${cleanName}`
		);
		return { success: true, message: `Klasifikasi ${cleanCode} berhasil diperbarui.` };
	},

	async deleteClassification(code: string): Promise<{ success: boolean; message: string }> {
		const cleanCode = code.trim().toUpperCase();
		const allBooks = await this.getBooks();

		// Check if any book is currently filed under this code
		const boundBooks = allBooks.filter(
			(b) =>
				b.ddcCode === cleanCode ||
				(b.classification &&
					(b.classification === cleanCode || b.classification.startsWith(cleanCode)))
		);
		if (boundBooks.length > 0) {
			return {
				success: false,
				message: `Tidak dapat menghapus klasifikasi ${cleanCode} karena masih memuat ${boundBooks.length} buku. Pindahkan buku ke klasifikasi lain terlebih dahulu.`
			};
		}

		// Check main node
		const mainIndex = inMemoryDdcTree.findIndex((n) => n.code === cleanCode);
		if (mainIndex !== -1) {
			const node = inMemoryDdcTree[mainIndex];
			if (node.subclasses && node.subclasses.length > 0) {
				for (const sub of node.subclasses) {
					const subBooks = allBooks.filter(
						(b) =>
							b.classification === sub.code ||
							(b.classification && b.classification.startsWith(sub.code))
					);
					if (subBooks.length > 0) {
						return {
							success: false,
							message: `Tidak dapat menghapus divisi ${cleanCode} karena sub-divisi ${sub.code} masih memiliki buku.`
						};
					}
				}
			}
			const removed = inMemoryDdcTree.splice(mainIndex, 1)[0];
			savePersistedData('classifications.json', inMemoryDdcTree);
			try {
				await db.delete(schema.classifications).where(eq(schema.classifications.code, cleanCode));
			} catch {
				// DB fallback
			}
			await this.addActivityLog('delete', `Menghapus klasifikasi: [${cleanCode}] ${removed.name}`);
			return { success: true, message: `Klasifikasi ${cleanCode} berhasil dihapus.` };
		}

		// Check subclass
		for (const parent of inMemoryDdcTree) {
			if (!parent.subclasses) continue;
			const subIndex = parent.subclasses.findIndex((s) => s.code === cleanCode);
			if (subIndex !== -1) {
				const removedSub = parent.subclasses.splice(subIndex, 1)[0];
				savePersistedData('classifications.json', inMemoryDdcTree);
				try {
					await db.delete(schema.classifications).where(eq(schema.classifications.code, cleanCode));
				} catch {
					// DB fallback
				}
				await this.addActivityLog(
					'delete',
					`Menghapus sub-klasifikasi: [${cleanCode}] ${removedSub.name}`
				);
				return { success: true, message: `Sub-klasifikasi ${cleanCode} berhasil dihapus.` };
			}
		}

		return { success: false, message: `Klasifikasi ${cleanCode} tidak ditemukan.` };
	},

	async getSearchLogs(): Promise<{
		popularQueries: SearchLogItem[];
		zeroQueries: SearchLogItem[];
	}> {
		try {
			const popular = await db
				.select()
				.from(schema.searchLogs)
				.where(sql`${schema.searchLogs.resultsCount} > 0`)
				.orderBy(desc(schema.searchLogs.count))
				.limit(10);
			const zero = await db
				.select()
				.from(schema.searchLogs)
				.where(eq(schema.searchLogs.resultsCount, 0))
				.orderBy(desc(schema.searchLogs.count))
				.limit(10);

			if (popular.length > 0 || zero.length > 0) {
				return {
					popularQueries: popular.map((p) => ({
						id: p.id,
						query: p.query,
						count: p.count,
						resultsCount: p.resultsCount,
						lastSearched: 'Baru saja'
					})),
					zeroQueries: zero.map((z) => ({
						id: z.id,
						query: z.query,
						count: z.count,
						resultsCount: z.resultsCount,
						lastSearched: 'Baru saja'
					}))
				};
			}
		} catch {
			// Fallback
		}

		return {
			popularQueries: inMemorySearchLogs,
			zeroQueries: inMemoryZeroSearchLogs
		};
	},

	async recordSearch(query: string, resultsCount: number): Promise<void> {
		const clean = query.trim().toLowerCase();
		if (!clean) return;

		try {
			await db
				.insert(schema.searchLogs)
				.values({
					id: 's-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
					query: clean,
					count: 1,
					resultsCount
				})
				.onConflictDoUpdate({
					target: schema.searchLogs.query,
					set: {
						count: sql`${schema.searchLogs.count} + 1`,
						resultsCount,
						updatedAt: new Date()
					}
				});
		} catch {
			// Fallback in-memory
		}

		const targetList = resultsCount === 0 ? inMemoryZeroSearchLogs : inMemorySearchLogs;
		const existing = targetList.find((s) => s.query.toLowerCase() === clean);
		if (existing) {
			existing.count += 1;
			existing.resultsCount = resultsCount;
		} else {
			targetList.unshift({
				id: 's-' + Date.now(),
				query: clean,
				count: 1,
				resultsCount,
				lastSearched: 'Baru saja'
			});
		}
		savePersistedData(
			resultsCount === 0 ? 'searches_zero.json' : 'searches.json',
			resultsCount === 0 ? inMemoryZeroSearchLogs : inMemorySearchLogs
		);
	},

	async getLogStats(): Promise<LogStats> {
		const actCount = inMemoryActivities.length;
		const popCount = inMemorySearchLogs.length;
		const zeroCount = inMemoryZeroSearchLogs.length;
		// Estimate ~128 bytes per activity audit log, ~64 bytes per search query
		const estimatedBytes = actCount * 128 + (popCount + zeroCount) * 64;

		return {
			activityLogCount: actCount,
			maxActivityLogs: MAX_ACTIVITY_LOGS,
			popularSearchCount: popCount,
			zeroSearchCount: zeroCount,
			estimatedSizeBytes: estimatedBytes,
			retentionPolicy: `Rolling Buffer FIFO (Maks. ${MAX_ACTIVITY_LOGS} Entri Terkini)`
		};
	},

	async rotateLogs(keepCount: number = 200): Promise<{ success: boolean; prunedCount: number }> {
		const initialCount = inMemoryActivities.length;
		if (inMemoryActivities.length > keepCount) {
			inMemoryActivities.length = keepCount;
		}
		const pruned = Math.max(0, initialCount - inMemoryActivities.length);
		savePersistedData('activities.json', inMemoryActivities);

		try {
			await db.execute(
				sql`DELETE FROM activity_logs WHERE id NOT IN (
					SELECT id FROM activity_logs ORDER BY created_at DESC LIMIT ${keepCount}
				)`
			);
		} catch {
			// DB fallback
		}

		await this.addActivityLog(
			'system',
			`Melakukan rotasi pemeliharaan log: memangkas ${pruned} riwayat lama (mempertahankan ${keepCount} entri)`
		);
		return { success: true, prunedCount: pruned };
	},

	async clearZeroSearchLogs(): Promise<{ success: boolean; deletedCount: number }> {
		const count = inMemoryZeroSearchLogs.length;
		inMemoryZeroSearchLogs.length = 0;
		savePersistedData('searches_zero.json', inMemoryZeroSearchLogs);

		try {
			await db.delete(schema.searchLogs).where(eq(schema.searchLogs.resultsCount, 0));
		} catch {
			// DB fallback
		}

		await this.addActivityLog(
			'system',
			`Membersihkan ${count} riwayat pencarian tanpa hasil (zero results) untuk efisiensi disk`
		);
		return { success: true, deletedCount: count };
	},

	async clearAllSearchLogs(): Promise<{ success: boolean }> {
		inMemorySearchLogs.length = 0;
		inMemoryZeroSearchLogs.length = 0;
		savePersistedData('searches.json', inMemorySearchLogs);
		savePersistedData('searches_zero.json', inMemoryZeroSearchLogs);

		try {
			await db.delete(schema.searchLogs);
		} catch {
			// DB fallback
		}

		await this.addActivityLog(
			'system',
			'Mengosongkan seluruh riwayat log pencarian sivitas untuk penyegaran berkala'
		);
		return { success: true };
	},

	async getLibrarySettings(): Promise<LibrarySettings> {
		try {
			const rows = await db
				.select()
				.from(schema.librarySettings)
				.where(eq(schema.librarySettings.key, 'default'))
				.limit(1);

			if (rows.length > 0 && rows[0].data) {
				return { ...inMemorySettings, ...rows[0].data };
			}
		} catch {
			// Fallback to inMemorySettings
		}
		return inMemorySettings;
	},

	async updateLibrarySettings(updates: Partial<LibrarySettings>): Promise<LibrarySettings> {
		inMemorySettings = {
			...inMemorySettings,
			...updates
		};
		savePersistedData('settings.json', inMemorySettings);

		try {
			await db
				.insert(schema.librarySettings)
				.values({
					key: 'default',
					data: inMemorySettings,
					updatedAt: new Date()
				})
				.onConflictDoUpdate({
					target: schema.librarySettings.key,
					set: {
						data: inMemorySettings,
						updatedAt: new Date()
					}
				});
		} catch {
			// Persisted in memory
		}

		return inMemorySettings;
	},

	async getLibrarianProfile(): Promise<LibrarianProfile> {
		if (await isDbOnline()) {
			try {
				const rows = await db
					.select()
					.from(schema.librarianProfile)
					.where(eq(schema.librarianProfile.id, 'default'))
					.limit(1);

				if (rows.length > 0 && rows[0].data) {
					return { ...(inMemoryLibrarian || INITIAL_LIBRARIAN_PROFILE), ...rows[0].data };
				}
			} catch {
				// Fallback
			}
		}
		return inMemoryLibrarian || { ...INITIAL_LIBRARIAN_PROFILE };
	},

	async updateLibrarianProfile(updates: Partial<LibrarianProfile>): Promise<LibrarianProfile> {
		inMemoryLibrarian = {
			...(inMemoryLibrarian || INITIAL_LIBRARIAN_PROFILE),
			...updates
		};
		savePersistedData('librarian.json', {
			profile: inMemoryLibrarian,
			password: inMemoryLibrarianPassword
		});

		if (await isDbOnline()) {
			try {
				await db
					.insert(schema.librarianProfile)
					.values({
						id: 'default',
						data: inMemoryLibrarian,
						updatedAt: new Date()
					})
					.onConflictDoUpdate({
						target: schema.librarianProfile.id,
						set: {
							data: inMemoryLibrarian,
							updatedAt: new Date()
						}
					});
			} catch {
				// Persisted in memory
			}
		}

		return inMemoryLibrarian;
	},

	async verifyLibrarianPassword(password: string): Promise<boolean> {
		return password === inMemoryLibrarianPassword;
	},

	async changeLibrarianPassword(
		oldPassword: string,
		newPassword: string
	): Promise<{ success: boolean; message: string }> {
		if (oldPassword !== inMemoryLibrarianPassword) {
			return { success: false, message: 'Kata sandi saat ini tidak sesuai.' };
		}
		if (newPassword.length < 6) {
			return { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' };
		}
		inMemoryLibrarianPassword = newPassword;
		savePersistedData('librarian.json', {
			profile: inMemoryLibrarian,
			password: inMemoryLibrarianPassword
		});
		return { success: true, message: 'Kata sandi pustakawan berhasil diperbarui.' };
	}
};
