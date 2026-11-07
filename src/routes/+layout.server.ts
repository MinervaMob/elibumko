import type { LayoutServerLoad } from './$types';
import { settingsService, categoryService } from '#lib/server/services';

export const load: LayoutServerLoad = async () => {
	const [profile, categories] = await Promise.all([
		settingsService.getProfile(),
		categoryService.getCategories()
	]);

	return {
		profile,
		footerCategories: categories.slice(0, 5)
	};
};
