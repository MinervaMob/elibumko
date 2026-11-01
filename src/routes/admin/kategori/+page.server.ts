import type { PageServerLoad } from './$types';
import { categoryService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const [ddcTree, categories] = await Promise.all([
		categoryService.getDdcTree(),
		categoryService.getCategories()
	]);

	return {
		ddcTree,
		categories
	};
};
