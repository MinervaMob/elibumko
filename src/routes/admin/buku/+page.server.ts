import type { PageServerLoad } from './$types';
import { bookService, categoryService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const [books, ddcTree, categories] = await Promise.all([
		bookService.getBooks(),
		categoryService.getDdcTree(),
		categoryService.getCategories()
	]);

	return {
		books,
		ddcTree,
		categories
	};
};
