import type { PageServerLoad } from './$types';
import { bookService, categoryService, settingsService, statsService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	try {
		const [books, categories, profile, heroMetrics] = await Promise.all([
			bookService.getBooks(),
			categoryService.getCategories(),
			settingsService.getProfile(),
			statsService.getHeroMetrics()
		]);

		return {
			books: books || [],
			categories: categories || [],
			profile: profile || undefined,
			heroMetrics: heroMetrics || {
				totalBooks: (books || []).length,
				totalCategories: (categories || []).length,
				totalReaders: 0
			}
		};
	} catch (err) {
		console.error('Error loading home page:', err);
		return {
			books: [],
			categories: [],
			profile: undefined,
			heroMetrics: {
				totalBooks: 0,
				totalCategories: 0,
				totalReaders: 0
			}
		};
	}
};
