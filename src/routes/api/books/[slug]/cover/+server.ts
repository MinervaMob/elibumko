import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookService, mediaService } from '#lib/server/services';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const slug = params.slug;
	if (!slug) {
		throw error(400, 'Slug buku diperlukan.');
	}

	const book = await bookService.getBookBySlug(slug);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan.');
	}

	// Jika buku memiliki URL sampul kustom yang diunggah
	if (book.coverUrl) {
		if (book.coverUrl.startsWith('/api/covers/')) {
			const fileName = book.coverUrl.replace('/api/covers/', '');
			try {
				const { buffer, mimeType } = await mediaService.getCover(fileName);
				setHeaders({
					'Content-Type': mimeType,
					'Content-Length': buffer.byteLength.toString(),
					'Cache-Control': 'public, max-age=31536000, immutable'
				});
				return new Response(new Uint8Array(buffer));
			} catch {
				// Fallback to dynamic SVG generator if file was removed
			}
		} else if (book.coverUrl.startsWith('http')) {
			throw redirect(302, book.coverUrl);
		}
	}

	// Hasilkan sampul SVG dinamis resmi dari Media Service
	const svg = mediaService.generateDynamicCover({
		title: book.title,
		author: book.author,
		classification: book.classification,
		category: book.category
	});

	setHeaders({
		'Content-Type': 'image/svg+xml; charset=utf-8',
		'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
	});

	return new Response(svg);
};
