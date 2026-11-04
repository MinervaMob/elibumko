import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { bookService, categoryService } from '#lib/server/services';

export const load: PageServerLoad = async ({ url }) => {
	if (url.searchParams.get('action') === 'tambah') {
		throw redirect(303, '/admin/buku/tambah');
	}

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
