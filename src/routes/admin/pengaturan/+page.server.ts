import type { PageServerLoad } from './$types';
import { statsService } from '#lib/server/services';

export const load: PageServerLoad = async () => {
	const stats = await statsService.getAdminStats();
	return { stats };
};
