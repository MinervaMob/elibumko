import type { PageServerLoad } from './$types';
import { bookService, statsService, activityService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const [stats, trend, popularBooks, activities, searchLogs] = await Promise.all([
		statsService.getAdminStats(),
		statsService.getReadingTrends(),
		bookService.getPopularBooks(5),
		activityService.getActivityLogs(),
		activityService.getSearchLogs()
	]);

	return {
		stats,
		trend,
		popularBooks,
		activities,
		popularQueries: searchLogs.popularQueries,
		zeroQueries: searchLogs.zeroQueries
	};
};
