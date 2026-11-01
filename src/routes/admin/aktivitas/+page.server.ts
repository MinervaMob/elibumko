import type { PageServerLoad } from './$types';
import { activityService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const [activities, searchLogs] = await Promise.all([
		activityService.getActivityLogs(),
		activityService.getSearchLogs()
	]);

	return {
		activities,
		popularQueries: searchLogs.popularQueries,
		zeroResultQueries: searchLogs.zeroQueries
	};
};
