import type { PageServerLoad } from './$types';
import { bookService, categoryService } from '#lib/server/services';

export const load: PageServerLoad = async ({ url }) => {
	const initialQuery = url.searchParams.get('q') || '';
	try {
		const [books, ddcTree, categories] = await Promise.all([
			bookService.getBooks(),
			categoryService.getDdcTree(),
			categoryService.getCategories()
		]);

		return {
			books: books || [],
			ddcTree: ddcTree || [],
			categories: categories || [],
			initialQuery
		};
	} catch (err) {
		console.error('Error loading /rak:', err);
		return {
			books: [],
			ddcTree: [],
			categories: [],
			initialQuery
		};
	}
};
