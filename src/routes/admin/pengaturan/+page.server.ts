import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { statsService, settingsService, activityService, mediaService } from '#lib/server/services';
import { DEFAULT_LIBRARIAN } from '#lib/server/auth-constants';

export const load: PageServerLoad = async () => {
	const [stats, settings] = await Promise.all([
		statsService.getAdminStats(),
		settingsService.getSettings()
	]);

	return {
		stats,
		settings
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString()?.trim();
		const institution = formData.get('institution')?.toString()?.trim();
		const title = formData.get('title')?.toString()?.trim();
		const email = formData.get('email')?.toString()?.trim();
		const phone = formData.get('phone')?.toString()?.trim();
		const address = formData.get('address')?.toString()?.trim();
		const hoursWeekday = formData.get('hoursWeekday')?.toString()?.trim();
		const hoursSaturday = formData.get('hoursSaturday')?.toString()?.trim();
		const storageLimitGB = Number(formData.get('storageLimitGB')) || 50;
		const storageDriver = (formData.get('storageDriver')?.toString()?.trim() || 'local') as
			'local' | 'custom_local' | 's3_minio';
		const customStoragePath = formData.get('customStoragePath')?.toString()?.trim() || '';
		const s3Endpoint = formData.get('s3Endpoint')?.toString()?.trim() || '';
		const s3Bucket = formData.get('s3Bucket')?.toString()?.trim() || '';

		if (!name || !institution) {
			return fail(400, {
				error: 'Nama perpustakaan dan institusi naungan wajib diisi.'
			});
		}

		if (storageDriver === 'custom_local' && customStoragePath) {
			const check = await mediaService.testStoragePath(customStoragePath);
			if (!check.success) {
				return fail(400, {
					error: `Verifikasi jalur penyimpanan gagal: ${check.message}`
				});
			}
		}

		const updatedSettings = await settingsService.updateSettings({
			name,
			institution,
			...(title ? { title } : {}),
			...(email ? { email } : {}),
			...(phone ? { phone } : {}),
			...(address ? { address } : {}),
			...(hoursWeekday ? { hoursWeekday } : {}),
			...(hoursSaturday ? { hoursSaturday } : {}),
			storageLimitGB,
			storageDriver,
			customStoragePath,
			s3Endpoint,
			s3Bucket
		});

		const currentUserName = locals.user?.name || DEFAULT_LIBRARIAN.name;
		await activityService.logActivity(
			'update',
			`Memperbarui konfigurasi perpustakaan (Penyedia media: ${storageDriver}${
				storageDriver === 'custom_local' ? ` [${customStoragePath}]` : ''
			})`,
			undefined,
			undefined,
			currentUserName
		);

		return {
			success: true,
			settings: updatedSettings,
			message: 'Pengaturan perpustakaan dan lokasi penyimpanan berhasil diperbarui.'
		};
	}
};
