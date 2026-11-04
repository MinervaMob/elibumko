import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mediaService, documentParserService } from '#lib/server/services';

const MAX_DOC_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

const DOC_EXTENSIONS = ['.pdf', '.epub', '.docx', '.doc'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const uploadType = (formData.get('type') as string | null) || 'auto';

		if (!file) {
			throw error(400, 'Berkas file wajib diunggah.');
		}

		const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
		const isImage = IMAGE_EXTENSIONS.includes(ext) || uploadType === 'cover';
		const isDoc = DOC_EXTENSIONS.includes(ext) || uploadType === 'document';

		if (!isImage && !isDoc) {
			throw error(
				400,
				'Format berkas tidak didukung. Unggah PDF/DOCX/EPUB untuk naskah atau JPG/PNG/WebP/AVIF untuk sampul.'
			);
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Handle Cover Image Upload
		if (isImage) {
			if (file.size > MAX_IMAGE_SIZE) {
				throw error(400, 'Ukuran berkas gambar sampul melebihi batas 10 MB.');
			}
			const result = await mediaService.saveCover(file.name, buffer);
			return json({
				success: true,
				type: 'cover',
				url: result.url,
				coverUrl: result.url,
				fileName: result.fileName,
				size: result.size
			});
		}

		// Handle Document Upload
		if (file.size > MAX_DOC_SIZE) {
			throw error(400, 'Ukuran berkas naskah melebihi batas maksimum 100 MB.');
		}

		const result = await mediaService.saveDocument(file.name, buffer);

		// Ekstraksi Metadata Otomatis secara cerdas
		let metadata = null;
		try {
			metadata = await documentParserService.extractMetadata(file.name, buffer);
		} catch {
			// metadata extraction is best-effort
		}

		return json({
			success: true,
			type: 'document',
			fileName: result.fileName,
			filePath: result.filePath,
			size: result.size,
			fileType: result.fileType,
			metadata
		});
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'status' in err) {
			throw err;
		}
		const message = err instanceof Error ? err.message : 'Kesalahan server saat memproses berkas';
		throw error(500, `Gagal memproses unggahan: ${message}`);
	}
};
