import { db } from './index';
import * as schema from './schema';
import { eq, desc, and, isNull, like, or, sql } from 'drizzle-orm';
import type {
	BookData,
	CategoryData,
	ClassificationNode,
	TableOfContentItem,
	ActivityLogItem,
	SearchLogItem,
	LibrarySettings
} from '#lib/types';
import {
	INITIAL_BOOKS,
	INITIAL_DDC_TREE,
	INITIAL_CATEGORIES,
	INITIAL_ACTIVITY_LOGS,
	INITIAL_SEARCH_LOGS,
	INITIAL_ZERO_SEARCH_LOGS,
	INITIAL_LIBRARY_SETTINGS
} from './seed-data';

// Persistent in-memory fallback state initialized from seed data
let inMemoryBooks: BookData[] = [...INITIAL_BOOKS];
const inMemoryActivities: ActivityLogItem[] = [...INITIAL_ACTIVITY_LOGS];
const inMemorySearchLogs: SearchLogItem[] = [...INITIAL_SEARCH_LOGS];
const inMemoryZeroSearchLogs: SearchLogItem[] = [...INITIAL_ZERO_SEARCH_LOGS];
let inMemorySettings: LibrarySettings = { ...INITIAL_LIBRARY_SETTINGS };

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
				return res;
			}
		} catch {
			// Fallback
		}

		const idx = inMemoryBooks.findIndex((b) => b.slug === slug);
		if (idx !== -1) {
			inMemoryBooks[idx] = { ...inMemoryBooks[idx], ...updates };
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
		return inMemoryBooks.length < initialLen;
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
		userName: string = 'Drs. H. Mulyadi, M.Pd.'
	): Promise<void> {
		const newLog: ActivityLogItem = {
			id: 'act-' + Date.now(),
			action,
			description,
			targetTitle,
			targetSlug,
			userName,
			timestamp: 'Baru saja'
		};
		inMemoryActivities.unshift(newLog);

		try {
			await db.insert(schema.activityLogs).values({
				id: newLog.id,
				action,
				description,
				targetTitle,
				targetSlug,
				userName
			});
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
				count: Math.max(count, cat.count)
			};
		});
	},

	async getDdcTree(): Promise<ClassificationNode[]> {
		const allBooks = await this.getBooks();
		return INITIAL_DDC_TREE.map((node) => {
			const nodeBooks = allBooks.filter((b) => b.ddcCode === node.code);
			const subclasses = (node.subclasses || []).map((sub) => {
				const subBooks = allBooks.filter(
					(b) => b.classification === sub.code || b.classification?.startsWith(sub.code)
				);
				return {
					...sub,
					count: Math.max(subBooks.length, sub.count)
				};
			});
			return {
				...node,
				count: Math.max(nodeBooks.length, node.count),
				subclasses
			};
		});
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
	}
};
