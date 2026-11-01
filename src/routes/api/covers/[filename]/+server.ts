import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mediaService } from '#lib/server/services';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const fileName = params.filename;
	if (!fileName) {
		throw error(400, 'Nama berkas sampul diperlukan.');
	}

	try {
		const { buffer, mimeType } = await mediaService.getCover(fileName);

		setHeaders({
			'Content-Type': mimeType,
			'Content-Length': buffer.byteLength.toString(),
			'Cache-Control': 'public, max-age=31536000, immutable'
		});

		return new Response(new Uint8Array(buffer));
	} catch {
		throw error(404, 'Berkas sampul tidak ditemukan di server.');
	}
};
