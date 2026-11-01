import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { statsService } from '#lib/server/services';

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
			stats: null
		};
	}

	// Strictly protect all other admin routes
	if (!event.locals.user) {
		const from = event.url.pathname + event.url.search;
		throw redirect(303, `/admin/login?redirectTo=${encodeURIComponent(from)}`);
	}

	const stats = await statsService.getAdminStats();

	return {
		user: event.locals.user,
		session: event.locals.session,
		stats
	};
};
