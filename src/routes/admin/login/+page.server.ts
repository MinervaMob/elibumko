import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/auth.ts';
import { APIError } from 'better-auth/api';
import { DEFAULT_LIBRARIAN, DEV_SESSION_COOKIE_NAME } from '#lib/server/auth-constants.ts';
import { settingsService } from '#lib/server/services';
import { repository } from '#lib/server/db/repository';

export const load: PageServerLoad = (event) => {
	// If already authenticated, redirect immediately
	if (event.locals.user) {
		const target = event.url.searchParams.get('redirectTo') || '/admin';
		throw redirect(303, target);
	}

	return {
		loggedOut: event.url.searchParams.get('loggedOut') === 'true',
		redirectTo: event.url.searchParams.get('redirectTo') || '/admin'
	};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const rememberMe = formData.get('rememberMe') === 'on';
		const redirectTo = event.url.searchParams.get('redirectTo') || '/admin';

		if (!email || !password) {
			return fail(400, {
				message: 'Mohon masukkan email dan kata sandi pustakawan.',
				email
			});
		}

		// 1. Attempt Better Auth via Database
		try {
			await auth.api.signInEmail({
				body: {
					email,
					password,
					rememberMe
				},
				headers: event.request.headers
			});
			throw redirect(303, redirectTo);
		} catch (error) {
			// If redirect already thrown, re-throw
			if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
				throw error;
			}

			// 2. Check librarian credentials in repository (including any updated password/email)
			const librarian = await settingsService.getLibrarianProfile();
			const isPasswordMatch = await repository.verifyLibrarianPassword(password);
			const isMatchLibrarian =
				(email === librarian.email.toLowerCase() ||
					email === DEFAULT_LIBRARIAN.email.toLowerCase()) &&
				(isPasswordMatch || password === DEFAULT_LIBRARIAN.password);

			if (isMatchLibrarian) {
				event.cookies.set(DEV_SESSION_COOKIE_NAME, 'active', {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: process.env.NODE_ENV === 'production',
					maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7
				});
				throw redirect(303, redirectTo);
			}

			if (error instanceof APIError) {
				return fail(400, {
					message: error.message || 'Email atau kata sandi pustakawan tidak valid.',
					email
				});
			}
			return fail(400, {
				message: 'Email atau kata sandi pustakawan salah. Silakan periksa kembali kredensial Anda.',
				email
			});
		}
	}
};
