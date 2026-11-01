import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookService, mediaService } from '#lib/server/services';

export const GET: RequestHandler = async ({ params }) => {
	const slug = params.slug;
	if (!slug) {
		throw error(400, 'Slug buku diperlukan.');
	}

	const book = await bookService.getBookBySlug(slug);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan.');
	}

	// 1. Cek dari nama berkas eksplisit jika buku memilikinya
	let fileName = book.filePath ? book.filePath.split('/').pop() || `${slug}.pdf` : `${slug}.pdf`;
	let exists = await mediaService.fileExists('book', fileName);

	// 2. Cek variasi ekstensi epub
	if (!exists) {
		fileName = `${slug}.epub`;
		exists = await mediaService.fileExists('book', fileName);
	}

	// 3. Fallback ke dokumen sampel yang ada di storage jika berkas baru belum diunggah
	if (!exists) {
		fileName = 'metodologi-penelitian-pendidikan-matematika-sains.pdf';
		exists = await mediaService.fileExists('book', fileName);
	}

	if (!exists) {
		throw error(404, 'Berkas naskah buku belum tersedia di penyimpanan terproteksi.');
	}

	try {
		const { buffer, mimeType, size } = await mediaService.getDocument(fileName);

		return new Response(new Uint8Array(buffer), {
			status: 200,
			headers: {
				'Content-Type': mimeType,
				'Content-Length': size.toString(),
				'Content-Disposition': 'inline',
				'X-Content-Type-Options': 'nosniff',
				'Cache-Control': 'private, max-age=3600',
				'X-Frame-Options': 'SAMEORIGIN'
			}
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Kesalahan server saat memuat berkas';
		throw error(500, `Gagal memuat berkas buku: ${message}`);
	}
};
