import type { PageServerLoad } from './$types';
import { bookService, categoryService } from '#lib/server/services';

export const load: PageServerLoad = async ({ params }) => {
	const code = params.kode;
	try {
		const [allBooks, node, category, ddcTree] = await Promise.all([
			bookService.getBooks(),
			categoryService.getDdcNodeByCode(code),
			categoryService.getCategoryByCode(code),
			categoryService.getDdcTree()
		]);

		const books = (allBooks || []).filter(
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
			books: books || [],
			node: node || null,
			category: category || null,
			ddcTree: ddcTree || []
		};
	} catch (err) {
		console.error(`Error loading /rak/${code}:`, err);
		return {
			code,
			title: `Klasifikasi DDC ${code}`,
			description: `Koleksi perpustakaan DDC ${code}.`,
			books: [],
			node: null,
			category: null,
			ddcTree: []
		};
	}
};
