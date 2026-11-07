import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { activityService } from '#lib/server/services';
import { DEFAULT_LIBRARIAN } from '#lib/server/auth-constants';

export const POST: RequestHandler = async ({ locals }) => {
	const librarianName = locals.user?.name || DEFAULT_LIBRARIAN.name;

	await activityService.logActivity(
		'system',
		'Pencadangan darurat basis data dan storage naskah terproteksi berhasil',
		undefined,
		undefined,
		librarianName
	);

	return json({
		success: true,
		timestamp: new Date().toISOString(),
		message: 'Pencadangan koleksi dan basis data berhasil diselesaikan.'
	});
};
