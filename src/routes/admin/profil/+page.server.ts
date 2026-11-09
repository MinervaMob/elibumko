import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { settingsService, activityService } from '#lib/server/services';
import { INITIAL_LIBRARIAN_PROFILE } from '#lib/server/db/seed-data';

export const load: PageServerLoad = async () => {
	try {
		const [librarian, activities] = await Promise.all([
			settingsService.getLibrarianProfile(),
			activityService.getActivityLogs()
		]);

		return {
			librarian: librarian || { ...INITIAL_LIBRARIAN_PROFILE },
			activities: (activities || []).slice(0, 10)
		};
	} catch (err) {
		console.error('[AdminProfilLoadError]', err);
		return {
			librarian: { ...INITIAL_LIBRARIAN_PROFILE },
			activities: []
		};
	}
};

export const actions: Actions = {
	updateProfile: async ({ request }) => {
		try {
			const formData = await request.formData();
			const name = formData.get('name')?.toString()?.trim();
			const email = formData.get('email')?.toString()?.trim()?.toLowerCase();
			const role = formData.get('role')?.toString()?.trim();
			const nidn = formData.get('nidn')?.toString()?.trim();
			const phone = formData.get('phone')?.toString()?.trim();
			const bio = formData.get('bio')?.toString()?.trim();

			if (!name || !email) {
				return fail(400, {
					profileError: 'Nama lengkap dan email pustakawan wajib diisi.'
				});
			}

			const updated = await settingsService.updateLibrarianProfile({
				name,
				email,
				role: role || 'Pustakawan Utama',
				nidn: nidn || '',
				phone: phone || '',
				bio: bio || ''
			});

			const librarianName = updated?.name || name;
			try {
				await activityService.logActivity(
					'update',
					`Memperbarui data profil pustakawan (${librarianName})`,
					undefined,
					undefined,
					librarianName
				);
			} catch {
				// Non-fatal if activity log encounters an issue
			}

			return {
				profileSuccess: true,
				profileMessage: 'Data profil pustakawan berhasil disimpan dan diperbarui.',
				librarian: updated
			};
		} catch (err: unknown) {
			console.error('[AdminProfilUpdateError]', err);
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, {
				profileError: `Gagal memperbarui profil pustakawan: ${msg}`
			});
		}
	},

	changePassword: async ({ request, locals }) => {
		try {
			const formData = await request.formData();
			const currentPassword = formData.get('currentPassword')?.toString() || '';
			const newPassword = formData.get('newPassword')?.toString() || '';
			const confirmPassword = formData.get('confirmPassword')?.toString() || '';

			if (!currentPassword || !newPassword || !confirmPassword) {
				return fail(400, {
					passwordError: 'Semua kolom kata sandi wajib diisi.'
				});
			}

			if (newPassword !== confirmPassword) {
				return fail(400, {
					passwordError: 'Konfirmasi kata sandi baru tidak cocok.'
				});
			}

			if (newPassword.length < 6) {
				return fail(400, {
					passwordError: 'Kata sandi baru minimal harus 6 karakter.'
				});
			}

			const result = await settingsService.changeLibrarianPassword(currentPassword, newPassword);
			if (!result.success) {
				return fail(400, {
					passwordError: result.message
				});
			}

			const currentName = locals.user?.name || 'Pustakawan';
			try {
				await activityService.logActivity(
					'update',
					'Memperbarui kata sandi akun pustakawan utama',
					undefined,
					undefined,
					currentName
				);
			} catch {
				// Non-fatal
			}

			return {
				passwordSuccess: true,
				passwordMessage: 'Kata sandi akun pustakawan berhasil diperbarui.'
			};
		} catch (err: unknown) {
			console.error('[ChangePasswordError]', err);
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, {
				passwordError: `Gagal memperbarui kata sandi: ${msg}`
			});
		}
	}
};
