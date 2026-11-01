import type { PageServerLoad } from './$types';
import { bookService, categoryService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const [books, categories] = await Promise.all([
		bookService.getBooks(),
		categoryService.getCategories()
	]);

	return {
		books,
		categories
	};
};
