import type { PageServerLoad } from './$types';
import { categoryService, bookService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const [ddcTree, categories, allBooks] = await Promise.all([
		categoryService.getDdcTree(),
		categoryService.getCategories(),
		bookService.getBooks()
	]);

	// Ekstrak daftar publisher unik yang sudah ada di sistem
	const existingPublishers = Array.from(
		new Set(
			allBooks
				.map((b) => b.publisher)
				.filter(Boolean)
				.concat(['UMKO Press', 'LPPM Universitas Muhammadiyah Kotabumi', 'Suara Muhammadiyah'])
		)
	) as string[];

	return {
		ddcTree,
		categories,
		existingPublishers
	};
};
