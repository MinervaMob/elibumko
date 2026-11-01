import { repository } from '../db/repository';
import type { ActivityLogItem, SearchLogItem } from '#lib/types';

export class ActivityService {
	/**
	 * Ambil log aktivitas pustakawan & sistem
	 */
	async getActivityLogs(): Promise<ActivityLogItem[]> {
		return repository.getActivityLogs();
	}

	/**
	 * Catat aksi pustakawan
	 */
	async logActivity(
		action: ActivityLogItem['action'],
		description: string,
		targetTitle?: string,
		targetSlug?: string,
		userName: string = 'Drs. H. Mulyadi, M.Pd.'
	): Promise<void> {
		await repository.addActivityLog(action, description, targetTitle, targetSlug, userName);
	}

	/**
	 * Dapatkan log pencarian pengguna (populer & nihil hasil)
	 */
	async getSearchLogs(): Promise<{
		popularQueries: SearchLogItem[];
		zeroQueries: SearchLogItem[];
	}> {
		return repository.getSearchLogs();
	}

	/**
	 * Rekam pencarian pembaca
	 */
	async recordSearch(query: string, resultsCount: number): Promise<void> {
		await repository.recordSearch(query, resultsCount);
	}
}

export const activityService = new ActivityService();
