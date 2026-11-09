import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { bookService } from '#lib/server/services';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const slug = params.slug;
	const book = await bookService.getBookBySlug(slug);

	if (!book) {
		throw error(404, 'Buku tidak ditemukan dalam katalog perpustakaan.');
	}

	// 1. Dapatkan atau inisialisasi cookie identifikasi perangkat anonim (berlaku 1 tahun)
	let deviceId = cookies.get('elib_device_id');
	if (!deviceId) {
		deviceId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
		cookies.set('elib_device_id', deviceId, {
			path: '/',
			maxAge: 365 * 24 * 60 * 60,
			sameSite: 'lax',
			httpOnly: false
		});
	}

	// 2. Baca peran pembaca dari cookie jika sudah pernah dipilih
	const readerRole = (cookies.get('elib_reader_role') as 'mahasiswa' | 'dosen' | 'umum') || 'umum';

	// 3. Catat sesi pembacaan dengan deduplikasi jendela 30-menit (COUNTER Library Standard)
	void bookService.recordReadingSession({
		bookSlug: slug,
		deviceHash: deviceId,
		role: readerRole
	});

	return {
		book,
		readerRole
	};
};

export const actions: Actions = {
	setRole: async ({ request, cookies }) => {
		const formData = await request.formData();
		const role = formData.get('role')?.toString() as 'mahasiswa' | 'dosen' | 'umum';

		if (['mahasiswa', 'dosen', 'umum'].includes(role)) {
			cookies.set('elib_reader_role', role, {
				path: '/',
				maxAge: 180 * 24 * 60 * 60,
				sameSite: 'lax',
				httpOnly: false
			});

			const deviceId = cookies.get('elib_device_id') || 'dev-unknown';
			await bookService.updateSessionRole(deviceId, role);
		}

		return { success: true, role };
	}
};
