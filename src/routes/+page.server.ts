import type { PageServerLoad } from './$types';
import { bookService, categoryService, settingsService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	try {
		const [books, categories, profile] = await Promise.all([
			bookService.getBooks(),
			categoryService.getCategories(),
			settingsService.getProfile()
		]);

		return {
			books: books || [],
			categories: categories || [],
			profile: profile || undefined
		};
	} catch (err) {
		console.error('Error loading home page:', err);
		return {
			books: [],
			categories: [],
			profile: undefined
		};
	}
};
