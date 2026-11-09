import type { RequestHandler } from './$types';
import { activityService } from '#lib/server/services';

function escapeCsvField(val: unknown): string {
	if (val === null || val === undefined) return '""';
	const str = String(val).replace(/"/g, '""');
	return `"${str}"`;
}

export const GET: RequestHandler = async () => {
	const [activities, searchLogs] = await Promise.all([
		activityService.getActivityLogs(),
		activityService.getSearchLogs()
	]);

	const activityHeaders = [
		'ID',
		'Tipe Aksi',
		'Deskripsi Aktivitas',
		'Target Naskah',
		'Slug Naskah',
		'Pustakawan',
		'Waktu'
	];

	const activityRows = activities.map((a) => [
		escapeCsvField(a.id),
		escapeCsvField(a.action),
		escapeCsvField(a.description),
		escapeCsvField(a.targetTitle || '-'),
		escapeCsvField(a.targetSlug || '-'),
		escapeCsvField(a.userName),
		escapeCsvField(a.timestamp)
	]);

	const searchHeaders = [
		'ID',
		'Kata Kunci Pencarian',
		'Frekuensi Dicari',
		'Jumlah Hasil Ditemukan',
		'Status'
	];
	const searchRows = [
		...searchLogs.popularQueries.map((s) => [
			escapeCsvField(s.id),
			escapeCsvField(s.query),
			escapeCsvField(s.count),
			escapeCsvField(s.resultsCount),
			escapeCsvField('Populer')
		]),
		...searchLogs.zeroQueries.map((s) => [
			escapeCsvField(s.id),
			escapeCsvField(s.query),
			escapeCsvField(s.count),
			escapeCsvField(s.resultsCount),
			escapeCsvField('Nihil / Tanpa Hasil')
		])
	];

	// UTF-8 BOM for Indonesian characters and Excel compatibility
	const bom = '\uFEFF';
	let csvContent = bom;

	csvContent += '=== LOG AUDIT AKTIVITAS PUSTAKAWAN ===\r\n';
	csvContent += activityHeaders.join(',') + '\r\n';
	activityRows.forEach((r) => {
		csvContent += r.join(',') + '\r\n';
	});

	csvContent += '\r\n=== LOG RIWAYAT PENCARIAN SIVITAS AKADEMIKA ===\r\n';
	csvContent += searchHeaders.join(',') + '\r\n';
	searchRows.forEach((r) => {
		csvContent += r.join(',') + '\r\n';
	});

	const dateStr = new Date().toISOString().slice(0, 10);
	const filename = `arsip-log-audit-elibumko-${dateStr}.csv`;

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-cache'
		}
	});
};
