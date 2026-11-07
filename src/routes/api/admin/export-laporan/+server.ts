import type { RequestHandler } from './$types';
import { bookService, activityService } from '#lib/server/services';
import { DEFAULT_LIBRARIAN } from '#lib/server/auth-constants';

function escapeCsvField(val: unknown): string {
	if (val === null || val === undefined) return '""';
	const str = String(val).replace(/"/g, '""');
	return `"${str}"`;
}

export const GET: RequestHandler = async ({ locals }) => {
	const books = await bookService.getBooks();

	const headers = [
		'ID',
		'Judul Naskah',
		'Pengarang',
		'Penerbit',
		'Tahun Terbit',
		'Edisi',
		'ISBN',
		'Halaman',
		'Kode DDC',
		'Nama DDC',
		'Kategori',
		'Total Pembaca',
		'Format Berkas',
		'Tanggal Registrasi'
	];

	const rows = books.map((b) => [
		escapeCsvField(b.id),
		escapeCsvField(b.title),
		escapeCsvField(b.author),
		escapeCsvField(b.publisher || '-'),
		escapeCsvField(b.year || '-'),
		escapeCsvField(b.edition || '-'),
		escapeCsvField(b.isbn || '-'),
		escapeCsvField(b.pages || 0),
		escapeCsvField(b.ddcCode || b.classification || '-'),
		escapeCsvField(b.ddcName || '-'),
		escapeCsvField(b.category || '-'),
		escapeCsvField(b.readersCount || 0),
		escapeCsvField(b.fileType || 'pdf'),
		escapeCsvField(b.createdAt || '-')
	]);

	// UTF-8 BOM for Excel compatibility
	const bom = '\uFEFF';
	const csvContent =
		bom + [headers.map(escapeCsvField).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

	const dateStr = new Date().toISOString().slice(0, 10);
	const filename = `katalog-buku-elibumko-${dateStr}.csv`;

	// Log export activity
	const librarianName = locals.user?.name || DEFAULT_LIBRARIAN.name;
	void activityService.logActivity(
		'system',
		`Mengekspor laporan katalog digital (${books.length} naskah) format CSV`,
		undefined,
		undefined,
		librarianName
	);

	return new Response(csvContent, {
		status: 200,
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
