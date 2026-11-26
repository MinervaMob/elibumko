import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookService, mediaService } from '#lib/server/services';
import { stat, open, readFile } from 'node:fs/promises';

export const GET: RequestHandler = async ({ params, request }) => {
	const slug = params.slug;
	if (!slug) {
		throw error(400, 'Slug buku diperlukan.');
	}

	const book = await bookService.getBookBySlug(slug);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan.');
	}

	const resolved = await mediaService.resolveBookFile({
		slug: book.slug,
		filePath: book.filePath,
		fileType: book.fileType,
		title: book.title
	});

	if (!resolved) {
		throw error(
			404,
			`Berkas naskah untuk buku "${book.title}" belum tersedia di media storage perpustakaan.`
		);
	}

	try {
		const fileStat = await stat(resolved.fullPath);
		const fileSize = fileStat.size;
		const mimeType = resolved.mimeType;

		// Standard security & caching headers
		const baseHeaders: Record<string, string> = {
			'Content-Type': mimeType,
			'Accept-Ranges': 'bytes',
			'Content-Disposition': 'inline',
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
			ETag: `"${fileStat.mtimeMs.toFixed(0)}-${fileSize}"`,
			'Last-Modified': fileStat.mtime.toUTCString(),
			'X-Frame-Options': 'SAMEORIGIN'
		};

		// 304 Not Modified
		const ifNoneMatch = request.headers.get('if-none-match');
		if (ifNoneMatch && ifNoneMatch === baseHeaders['ETag']) {
			return new Response(null, {
				status: 304,
				headers: baseHeaders
			});
		}

		// Handle HTTP Range Requests (RFC 7233) with safe buffer chunks
		const rangeHeader = request.headers.get('range');
		if (rangeHeader && rangeHeader.startsWith('bytes=')) {
			const parts = rangeHeader.replace('bytes=', '').trim().split('-');
			let start = parseInt(parts[0], 10);
			let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

			// Handle suffix range (e.g. bytes=-500)
			if (isNaN(start)) {
				start = fileSize - parseInt(parts[1], 10);
				end = fileSize - 1;
			}
			if (isNaN(end) || end >= fileSize) {
				end = fileSize - 1;
			}
			if (start < 0) start = 0;

			// Invalid range requested
			if (start > end || start >= fileSize) {
				return new Response(null, {
					status: 416,
					headers: {
						'Content-Range': `bytes */${fileSize}`,
						'Accept-Ranges': 'bytes'
					}
				});
			}

			const chunkLength = end - start + 1;
			const fileHandle = await open(resolved.fullPath, 'r');
			const chunkBuffer = Buffer.alloc(chunkLength);
			await fileHandle.read(chunkBuffer, 0, chunkLength, start);
			await fileHandle.close();

			return new Response(new Uint8Array(chunkBuffer), {
				status: 206, // Partial Content
				headers: {
					...baseHeaders,
					'Content-Length': chunkLength.toString(),
					'Content-Range': `bytes ${start}-${end}/${fileSize}`
				}
			});
		}

		// Full file streaming via buffer (clean, fast, avoids stream lockups)
		const fullBuffer = await readFile(resolved.fullPath);
		return new Response(new Uint8Array(fullBuffer), {
			status: 200,
			headers: {
				...baseHeaders,
				'Content-Length': fileSize.toString()
			}
		});
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'status' in err) {
			throw err;
		}
		const message = err instanceof Error ? err.message : 'Kesalahan server saat memuat berkas';
		throw error(500, `Gagal memuat berkas buku: ${message}`);
	}
};
