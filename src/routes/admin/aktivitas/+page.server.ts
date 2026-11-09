import type { PageServerLoad, Actions } from './$types';
import { activityService } from '#lib/server/services';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [activities, searchLogs, logStats] = await Promise.all([
		activityService.getActivityLogs(),
		activityService.getSearchLogs(),
		activityService.getLogStats()
	]);

	return {
		activities,
		popularQueries: searchLogs.popularQueries,
		zeroResultQueries: searchLogs.zeroQueries,
		logStats
	};
};

export const actions: Actions = {
	rotateLogs: async () => {
		const result = await activityService.rotateLogs(200);
		if (!result.success) {
			return fail(500, { error: 'Gagal melakukan rotasi log.' });
		}
		return {
			success: true,
			message: `Rotasi log berhasil. ${result.prunedCount} catatan lama berhasil dipangkas, mempertahankan 200 entri terkini.`
		};
	},

	clearZeroSearches: async () => {
		const result = await activityService.clearZeroSearchLogs();
		if (!result.success) {
			return fail(500, { error: 'Gagal membersihkan log pencarian nihil.' });
		}
		return {
			success: true,
			message: `Berhasil membersihkan ${result.deletedCount} kata kunci pencarian tanpa hasil (zero results).`
		};
	},

	clearAllSearches: async () => {
		const result = await activityService.clearAllSearchLogs();
		if (!result.success) {
			return fail(500, { error: 'Gagal mengosongkan log pencarian.' });
		}
		return {
			success: true,
			message: 'Seluruh riwayat kata kunci pencarian sivitas akademika berhasil direset.'
		};
	}
};
