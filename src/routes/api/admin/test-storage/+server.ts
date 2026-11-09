import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mediaService } from '#lib/server/services';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, message: 'Tidak terotentikasi.' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const targetPath = body.path ? String(body.path) : '';
		const result = await mediaService.testStoragePath(targetPath);
		return json(result);
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return json({ success: false, message: msg }, { status: 400 });
	}
};
