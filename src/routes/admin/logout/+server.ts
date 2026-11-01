import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '#lib/server/auth.ts';
import { DEV_SESSION_COOKIE_NAME } from '#lib/server/auth-constants.ts';

async function performLogout(event: Parameters<RequestHandler>[0]): Promise<never> {
	try {
		await auth.api.signOut({
			headers: event.request.headers
		});
	} catch {
		// Suppress signOut error if DB offline
	}

	event.cookies.delete(DEV_SESSION_COOKIE_NAME, { path: '/' });
	event.locals.user = undefined;
	event.locals.session = undefined;

	return redirect(303, '/admin/login?loggedOut=true');
}

export const POST: RequestHandler = async (event) => {
	return performLogout(event);
};

export const GET: RequestHandler = async (event) => {
	return performLogout(event);
};
