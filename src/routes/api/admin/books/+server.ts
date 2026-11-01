import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookService } from '#lib/server/services';

export const GET: RequestHandler = async ({ url }) => {
	const search = url.searchParams.get('q') ?? undefined;
	const category = url.searchParams.get('kategori') ?? undefined;
	const ddcCode = url.searchParams.get('ddc') ?? undefined;

	const books = await bookService.getBooks({ search, category, ddcCode });
	return json({ success: true, count: books.length, books });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.json();

		if (!payload.title || !payload.title.trim()) {
			throw error(400, 'Judul buku wajib diisi.');
		}
		if (!payload.author || !payload.author.trim()) {
			throw error(400, 'Nama penulis wajib diisi.');
		}

		const created = await bookService.createBook({
			title: payload.title.trim(),
			author: payload.author.trim(),
			publisher: payload.publisher?.trim() || 'UMKO Press',
			year: payload.year ? parseInt(payload.year) : new Date().getFullYear(),
			edition: payload.edition?.trim() || 'Edisi Pertama',
			isbn: payload.isbn?.trim() || undefined,
			pages: payload.pages ? parseInt(payload.pages) : undefined,
			language: payload.language || 'Bahasa Indonesia',
			classification: payload.classification?.trim() || '000',
			ddcCode: payload.ddcCode || '000',
			ddcName: payload.ddcName || 'Karya Umum',
			category: payload.category || 'Umum',
			tags: Array.isArray(payload.tags) ? payload.tags : [],
			synopsis: payload.synopsis?.trim() || '',
			toc: Array.isArray(payload.toc) ? payload.toc : [],
			isFeatured: Boolean(payload.isFeatured),
			fileType: payload.fileType === 'epub' ? 'epub' : 'pdf',
			filePath: payload.filePath || undefined,
			fileSize: payload.fileSize ? parseInt(payload.fileSize) : undefined,
			coverUrl: payload.coverUrl || null
		});

		return json({ success: true, book: created }, { status: 201 });
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Kesalahan server';
		throw error(500, `Gagal menambahkan buku: ${message}`);
	}
};
