import type { PageServerLoad } from './$types';
import { bookService, categoryService } from '#lib/server/services';

export const load: PageServerLoad = async ({ url }) => {
	const initialQuery = url.searchParams.get('q') || '';
	const [books, ddcTree, categories] = await Promise.all([
		bookService.getBooks(),
		categoryService.getDdcTree(),
		categoryService.getCategories()
	]);

	return {
		books,
		ddcTree,
		categories,
		initialQuery
	};
};
