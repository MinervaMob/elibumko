import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookService, activityService } from '#lib/server/services';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const trimmed = query.trim();

	if (!trimmed) {
		return json({
			success: true,
			books: [],
			categories: [],
			authors: []
		});
	}

	const result = await bookService.searchAutocomplete(trimmed);
	const totalResults = result.books.length + result.categories.length + result.authors.length;

	// Record in search logs asynchronously
	void activityService.recordSearch(trimmed, totalResults);

	return json({
		success: true,
		...result
	});
};
