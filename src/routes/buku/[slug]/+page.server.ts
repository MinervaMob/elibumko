import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { bookService } from '#lib/server/services';

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;
	const book = await bookService.getBookBySlug(slug);

	if (!book) {
		throw error(404, `Buku dengan slug "${slug}" tidak ditemukan dalam katalog perpustakaan.`);
	}

	const relatedBooks = await bookService.getRelatedBooks(book, 5);

	return {
		book,
		relatedBooks
	};
};
