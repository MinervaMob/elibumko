import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { bookService } from '#lib/server/services';

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;
	const book = await bookService.getBookBySlug(slug);

	if (!book) {
		throw error(404, 'Buku tidak ditemukan dalam katalog perpustakaan.');
	}

	// Increment reader view count asynchronously
	void bookService.incrementReaders(slug);

	return { book };
};
