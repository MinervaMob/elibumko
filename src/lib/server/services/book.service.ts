import { repository } from '../db/repository';
import type { BookData, TableOfContentItem } from '#lib/types';

export class BookService {
	/**
	 * Dapatkan daftar buku dengan filter pencarian, kategori, DDC, dll.
	 */
	async getBooks(options?: {
		search?: string;
		category?: string;
		ddcCode?: string;
		includeDeleted?: boolean;
		limit?: number;
		offset?: number;
	}): Promise<BookData[]> {
		const books = await repository.getBooks(options);
		if (options?.limit) {
			const offset = options.offset || 0;
			return books.slice(offset, offset + options.limit);
		}
		return books;
	}

	/**
	 * Dapatkan satu buku berdasarkan slug
	 */
	async getBookBySlug(slug: string): Promise<BookData | null> {
		if (!slug) return null;
		return repository.getBookBySlug(slug);
	}

	/**
	 * Dapatkan buku populer berdasarkan jumlah pembaca
	 */
	async getPopularBooks(limit = 10): Promise<BookData[]> {
		const all = await repository.getBooks();
		return [...all].sort((a, b) => (b.readersCount || 0) - (a.readersCount || 0)).slice(0, limit);
	}

	/**
	 * Dapatkan buku pilihan pustakawan (featured/rekomendasi)
	 */
	async getFeaturedBooks(limit = 10): Promise<BookData[]> {
		const all = await repository.getBooks();
		return all.filter((b) => b.isFeatured || b.isSaved).slice(0, limit);
	}

	/**
	 * Dapatkan rekomendasi buku terkait
	 */
	async getRelatedBooks(currentBook: BookData, limit = 4): Promise<BookData[]> {
		const all = await repository.getBooks();
		return all
			.filter(
				(b) =>
					b.slug !== currentBook.slug &&
					(b.category === currentBook.category || b.ddcCode === currentBook.ddcCode)
			)
			.slice(0, limit);
	}

	/**
	 * Tambah buku baru ke katalog
	 */
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
		const created = await repository.createBook(data);
		await repository.addActivityLog(
			'upload',
			`Mengunggah naskah baru "${created.title}"`,
			created.title,
			created.slug
		);
		return created;
	}

	/**
	 * Perbarui data buku
	 */
	async updateBook(slug: string, updates: Partial<BookData>): Promise<BookData | null> {
		const updated = await repository.updateBook(slug, updates);
		if (updated) {
			await repository.addActivityLog(
				'update',
				`Memperbarui data katalog "${updated.title}"`,
				updated.title,
				updated.slug
			);
		}
		return updated;
	}

	/**
	 * Hapus buku (soft delete)
	 */
	async deleteBook(slug: string): Promise<boolean> {
		const book = await repository.getBookBySlug(slug);
		const success = await repository.deleteBook(slug);
		if (success && book) {
			await repository.addActivityLog(
				'delete',
				`Menghapus katalog pustaka "${book.title}"`,
				book.title,
				book.slug
			);
		}
		return success;
	}

	/**
	 * Catat pembacaan buku
	 */
	async incrementReaders(slug: string): Promise<void> {
		await repository.incrementReaders(slug);
	}

	/**
	 * Pencarian cepat live autocomplete (judul, penulis, kategori)
	 */
	async searchAutocomplete(query: string): Promise<{
		books: {
			title: string;
			slug: string;
			author: string;
			classification?: string;
			category?: string;
		}[];
		categories: { code: string; name: string }[];
		authors: string[];
	}> {
		const q = query.trim().toLowerCase();
		if (!q) {
			return { books: [], categories: [], authors: [] };
		}

		const allBooks = await repository.getBooks();
		const categories = await repository.getCategories();

		const matchingBooks = allBooks
			.filter(
				(b) =>
					b.title.toLowerCase().includes(q) ||
					b.author.toLowerCase().includes(q) ||
					(b.classification && b.classification.toLowerCase().includes(q)) ||
					(b.category && b.category.toLowerCase().includes(q))
			)
			.slice(0, 5)
			.map((b) => ({
				title: b.title,
				slug: b.slug,
				author: b.author,
				classification: b.classification ?? undefined,
				category: b.category ?? undefined
			}));

		const matchingCategories = categories
			.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
			.slice(0, 3)
			.map((c) => ({ code: c.code, name: c.name, count: c.count }));

		const allAuthors = Array.from(new Set(allBooks.map((b) => b.author)));
		const matchingAuthors = allAuthors.filter((a) => a.toLowerCase().includes(q)).slice(0, 3);

		return {
			books: matchingBooks,
			categories: matchingCategories,
			authors: matchingAuthors
		};
	}
}

export const bookService = new BookService();
