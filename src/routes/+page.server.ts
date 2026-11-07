import type { PageServerLoad } from './$types';
import { bookService, categoryService, settingsService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const [books, categories, profile] = await Promise.all([
		bookService.getBooks(),
		categoryService.getCategories(),
		settingsService.getProfile()
	]);

	return {
		books,
		categories,
		profile
	};
};
