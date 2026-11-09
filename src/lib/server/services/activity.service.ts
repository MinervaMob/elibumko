import { repository } from '../db/repository';
import { DEFAULT_LIBRARIAN } from '../auth-constants';
import type { ActivityLogItem, SearchLogItem, LogStats } from '#lib/types';

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
		userName: string = DEFAULT_LIBRARIAN.name
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

	/**
	 * Dapatkan ringkasan metrik dan retensi penyimpanan log
	 */
	async getLogStats(): Promise<LogStats> {
		return repository.getLogStats();
	}

	/**
	 * Lakukan rotasi pangkas FIFO untuk menjaga penyimpanan server tetap ringan
	 */
	async rotateLogs(keepCount: number = 200): Promise<{ success: boolean; prunedCount: number }> {
		return repository.rotateLogs(keepCount);
	}

	/**
	 * Bersihkan riwayat pencarian tanpa hasil (zero results)
	 */
	async clearZeroSearchLogs(): Promise<{ success: boolean; deletedCount: number }> {
		return repository.clearZeroSearchLogs();
	}

	/**
	 * Bersihkan seluruh log pencarian
	 */
	async clearAllSearchLogs(): Promise<{ success: boolean }> {
		return repository.clearAllSearchLogs();
	}
}

export const activityService = new ActivityService();
