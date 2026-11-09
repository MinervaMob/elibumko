import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { statsService, settingsService } from '#lib/server/services';

export const load: LayoutServerLoad = async (event) => {
	const isLoginPage = event.url.pathname === '/admin/login';

	// If accessing the login page while already authenticated, go to dashboard
	if (isLoginPage) {
		if (event.locals.user) {
			const redirectTo = event.url.searchParams.get('redirectTo') || '/admin';
			throw redirect(303, redirectTo);
		}
		return {
			user: null,
			session: null,
			stats: null,
			librarianProfile: null
		};
	}

	// Strictly protect all other admin routes
	if (!event.locals.user) {
		const from = event.url.pathname + event.url.search;
		throw redirect(303, `/admin/login?redirectTo=${encodeURIComponent(from)}`);
	}

	try {
		const [stats, librarianProfile] = await Promise.all([
			statsService.getAdminStats(),
			settingsService.getLibrarianProfile()
		]);

		const safeProf = librarianProfile || {
			id: 'pustakawan-umko',
			name: event.locals.user.name || 'Ilham Pangestu, S.Kom',
			email: event.locals.user.email || 'pustakawan@umko.ac.id',
			role: 'Pustakawan Utama',
			nidn: '',
			phone: '',
			bio: '',
			avatar: null,
			lastLogin: 'Baru saja'
		};

		const user = {
			...event.locals.user,
			name: safeProf.name || event.locals.user.name,
			email: safeProf.email || event.locals.user.email,
			role: safeProf.role || 'Pustakawan Utama',
			nidn: safeProf.nidn || '',
			phone: safeProf.phone || '',
			bio: safeProf.bio || ''
		};

		return {
			user,
			session: event.locals.session,
			stats,
			librarianProfile: safeProf
		};
	} catch (err) {
		console.error('[AdminLayoutLoadError]', err);
		return {
			user: event.locals.user,
			session: event.locals.session,
			stats: null,
			librarianProfile: null
		};
	}
};
