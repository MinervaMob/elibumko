import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookService } from '#lib/server/services';

export const GET: RequestHandler = async ({ params }) => {
	const book = await bookService.getBookBySlug(params.slug);
	if (!book) throw error(404, 'Buku tidak ditemukan.');
	return json({ success: true, book });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const updates = await request.json();
		const updated = await bookService.updateBook(params.slug, updates);

		if (!updated) throw error(404, 'Buku tidak ditemukan untuk diperbarui.');

		return json({ success: true, book: updated });
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Kesalahan server';
		throw error(500, `Gagal memperbarui buku: ${message}`);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const book = await bookService.getBookBySlug(params.slug);
		if (!book) throw error(404, 'Buku tidak ditemukan.');

		const deleted = await bookService.deleteBook(params.slug);
		if (!deleted) throw error(500, 'Gagal menghapus buku.');

		return json({ success: true, message: `Buku "${book.title}" berhasil dihapus.` });
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Kesalahan server';
		throw error(500, `Gagal menghapus buku: ${message}`);
	}
};
