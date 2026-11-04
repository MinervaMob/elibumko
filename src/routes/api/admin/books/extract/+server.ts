import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { documentParserService, mediaService } from '#lib/server/services';

const MAX_DOC_SIZE = 100 * 1024 * 1024; // 100 MB
const SUPPORTED_EXT = ['.pdf', '.epub', '.docx', '.doc'];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const shouldSave = formData.get('save') === 'true';

		if (!file) {
			throw error(400, 'Berkas naskah wajib diunggah.');
		}

		const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
		if (!SUPPORTED_EXT.includes(ext)) {
			throw error(
				400,
				'Format berkas tidak didukung. Unggah berkas naskah PDF (.pdf), Microsoft Word (.docx), atau EPUB (.epub).'
			);
		}

		if (file.size > MAX_DOC_SIZE) {
			throw error(400, 'Ukuran berkas naskah melebihi batas maksimum 100 MB.');
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// 1. Ekstraksi Metadata Otomatis
		const metadata = await documentParserService.extractMetadata(file.name, buffer);

		// 2. Simpan jika diminta
		let fileData: { filePath: string; fileName: string; size: number; fileType: string } | null =
			null;
		if (shouldSave) {
			const saved = await mediaService.saveDocument(file.name, buffer);
			fileData = saved;
		}

		return json({
			success: true,
			fileName: file.name,
			fileSize: file.size,
			saved: fileData,
			metadata
		});
	} catch (err: unknown) {
		if (typeof err === 'object' && err !== null && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Kesalahan pemrosesan naskah';
		throw error(500, `Gagal mengekstrak metadata dokumen: ${message}`);
	}
};
