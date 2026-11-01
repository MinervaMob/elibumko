import type { PageServerLoad } from './$types';
import { bookService, categoryService } from '#lib/server/services';

export const load: PageServerLoad = async ({ params }) => {
	const code = params.kode;
	const [allBooks, node, category, ddcTree] = await Promise.all([
		bookService.getBooks(),
		categoryService.getDdcNodeByCode(code),
		categoryService.getCategoryByCode(code),
		categoryService.getDdcTree()
	]);

	const books = allBooks.filter(
		(b) =>
			b.ddcCode === code ||
			(b.classification && b.classification.startsWith(code)) ||
			b.category === category?.name
	);

	const title = node?.name ?? category?.name ?? `Klasifikasi DDC ${code}`;
	const description =
		category?.description ?? `Koleksi resmi klasifikasi perpustakaan DDC ${code}.`;

	return {
		code,
		title,
		description,
		books,
		node,
		category,
		ddcTree
	};
};
