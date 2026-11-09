import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { bookService, categoryService, activityService } from '#lib/server/services';
import type { TableOfContentItem } from '#lib/types';

export const load: PageServerLoad = async ({ params }) => {
	const book = await bookService.getBookBySlug(params.slug);

	if (!book) {
		throw error(404, `Naskah buku dengan slug "${params.slug}" tidak ditemukan.`);
	}

	const [ddcTree, categories, allBooks] = await Promise.all([
		categoryService.getDdcTree(),
		categoryService.getCategories(),
		bookService.getBooks()
	]);

	const existingPublishers = Array.from(
		new Set(
			allBooks
				.map((b) => b.publisher)
				.filter(Boolean)
				.concat(['UMKO Press', 'LPPM Universitas Muhammadiyah Kotabumi', 'Suara Muhammadiyah'])
		)
	) as string[];

	return {
		book,
		ddcTree,
		categories,
		existingPublishers
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim();
		const author = formData.get('author')?.toString().trim();

		if (!title || !author) {
			return fail(400, { error: 'Judul dan penulis naskah wajib diisi.' });
		}

		const publisher = formData.get('publisher')?.toString().trim() || undefined;
		const yearVal = formData.get('year')?.toString().trim();
		const year = yearVal ? parseInt(yearVal, 10) : undefined;
		const edition = formData.get('edition')?.toString().trim() || undefined;
		const isbn = formData.get('isbn')?.toString().trim() || undefined;
		const pagesVal = formData.get('pages')?.toString().trim();
		const pages = pagesVal ? parseInt(pagesVal, 10) : undefined;
		const language = formData.get('language')?.toString().trim() || 'Bahasa Indonesia';
		const classification = formData.get('classification')?.toString().trim() || undefined;
		const ddcCode = formData.get('ddcCode')?.toString().trim() || undefined;
		const ddcName = formData.get('ddcName')?.toString().trim() || undefined;
		const category = formData.get('category')?.toString().trim() || undefined;
		const synopsis = formData.get('synopsis')?.toString().trim() || undefined;
		const isFeatured = formData.get('isFeatured') === 'true';
		const coverUrl = formData.get('coverUrl')?.toString().trim() || undefined;
		const filePath = formData.get('filePath')?.toString().trim() || undefined;
		const fileSizeVal = formData.get('fileSize')?.toString().trim();
		const fileSize = fileSizeVal ? parseInt(fileSizeVal, 10) : undefined;
		const fileType = formData.get('fileType')?.toString().trim() as
			'pdf' | 'epub' | 'docx' | undefined;

		let tags: string[] = [];
		const tagsJson = formData.get('tags')?.toString();
		if (tagsJson) {
			try {
				tags = JSON.parse(tagsJson);
			} catch {
				tags = tagsJson
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean);
			}
		}

		let toc: TableOfContentItem[] = [];
		const tocJson = formData.get('toc')?.toString();
		if (tocJson) {
			try {
				toc = JSON.parse(tocJson);
			} catch {
				// ignore
			}
		}

		const updated = await bookService.updateBook(params.slug, {
			title,
			author,
			publisher,
			year,
			edition,
			isbn,
			pages,
			language,
			classification,
			ddcCode,
			ddcName,
			category,
			tags,
			synopsis,
			toc,
			isFeatured,
			coverUrl,
			filePath,
			fileSize,
			fileType
		});

		if (!updated) {
			return fail(500, { error: 'Gagal memperbarui data naskah buku.' });
		}

		await activityService.logActivity(
			'update',
			`Memperbarui metadata naskah buku: "${title}"`,
			title,
			params.slug
		);

		throw redirect(303, `/admin/buku?updated=${encodeURIComponent(title)}`);
	}
};
