import type {
	BookData,
	CategoryData,
	ClassificationNode,
	ActivityLogItem,
	SearchLogItem,
	LibrarySettings,
	LibrarianProfile
} from '#lib/types';

export const INITIAL_DDC_TREE: ClassificationNode[] = [
	{
		code: '000',
		name: 'Karya Umum, Komputer & Informasi',
		count: 0,
		subclasses: [
			{ code: '004', name: 'Pemrosesan Data & Arsitektur Komputer', count: 0 },
			{ code: '005', name: 'Pemrograman, Algoritma & Perangkat Lunak', count: 0 }
		]
	},
	{
		code: '100',
		name: 'Filsafat & Etika Keilmuan',
		count: 0,
		subclasses: [{ code: '170', name: 'Etika Profesi & Filsafat Moral', count: 0 }]
	},
	{
		code: '200',
		name: 'Agama & Studi Islam',
		count: 0,
		subclasses: [
			{ code: '297.1', name: "Al-Qur'an dan Hadis Kontemporer", count: 0 },
			{ code: '297.6', name: 'Kemuhammadiyahan, Tarjih & Tajdid', count: 0 }
		]
	},
	{
		code: '300',
		name: 'Ilmu Sosial, Hukum & Pendidikan',
		count: 0,
		subclasses: [
			{ code: '340', name: 'Ilmu Hukum & Peradilan Indonesia', count: 0 },
			{ code: '370', name: 'Pendidikan Dasar & Teori Pedagogi', count: 0 },
			{ code: '371', name: 'Manajemen Sekolah & Profesi Pendidik', count: 0 }
		]
	},
	{
		code: '400',
		name: 'Bahasa & Linguistik Nusantara',
		count: 0,
		subclasses: [
			{ code: '410', name: 'Linguistik Teoretis & Terapan', count: 0 },
			{ code: '499.2', name: 'Bahasa & Sastra Lampung Tradisional', count: 0 }
		]
	},
	{
		code: '500',
		name: 'Sains Murni & Matematika',
		count: 0,
		subclasses: [
			{ code: '510', name: 'Aljabar & Analisis Real Matematika', count: 0 },
			{ code: '519', name: 'Statistika Terapan & Probabilitas Riset', count: 0 }
		]
	},
	{
		code: '600',
		name: 'Teknologi & Ilmu Terapan',
		count: 0,
		subclasses: [
			{ code: '650', name: 'Kewirausahaan & Manajemen UMKM', count: 0 },
			{ code: '658', name: 'Manajemen Keuangan & Perbankan Syariah', count: 0 }
		]
	}
];

export const INITIAL_CATEGORIES: CategoryData[] = [
	{
		code: '000',
		name: 'Komputer & Sains Data',
		count: 0,
		color: 'brick',
		description: 'Algoritma, pemrograman, keamanan jaringan, dan kecerdasan artifisial.'
	},
	{
		code: '100',
		name: 'Filsafat & Etika',
		count: 0,
		color: 'terracotta',
		description: 'Logika epistemologi dan etika profesi akademik.'
	},
	{
		code: '297',
		name: 'Kemuhammadiyahan & Islam',
		count: 0,
		color: 'ink',
		description: 'Kajian tajdid, pemikiran K.H. Ahmad Dahlan, dan fiqih peradaban.'
	},
	{
		code: '300',
		name: 'Ilmu Sosial & Hukum',
		count: 0,
		color: 'sand',
		description: 'Hukum tata negara, perdata, pidana, dan administrasi publik.'
	},
	{
		code: '370',
		name: 'Pendidikan & Pedagogi',
		count: 0,
		color: 'brick',
		description: 'Metodologi pembelajaran, evaluasi pendidikan, dan kurikulum Merdeka.'
	},
	{
		code: '400',
		name: 'Bahasa & Budaya Lampung',
		count: 0,
		color: 'terracotta',
		description: 'Kajian linguistik Austronesia, fonologi, dan pelestarian aksara Lampung.'
	},
	{
		code: '500',
		name: 'Sains & Matematika',
		count: 0,
		color: 'sand',
		description: 'Analisis kalkulus, statistika penelitian kuantitatif, dan fisika komputasi.'
	},
	{
		code: '650',
		name: 'Manajemen & Ekonomi Syariah',
		count: 0,
		color: 'ink',
		description: 'Lembaga keuangan mikro syariah, tata kelola bisnis, dan kewirausahaan.'
	}
];

export const INITIAL_BOOKS: BookData[] = [
	{
		id: 1,
		title: 'KAJIAN PROSA FIKSI',
		slug: 'kajian-prosa-fiksi',
		author: 'Sri Widayati',
		publisher: 'LPPM Universitas Muhammadiyah Buton Press',
		year: 2002,
		edition: 'edisi V 2009',
		isbn: '978-623-92920-0-3',
		pages: 141,
		language: 'Bahasa Indonesia',
		classification: '899.221',
		ddcCode: '400',
		ddcName: 'Bahasa & Linguistik Nusantara',
		category: 'Bahasa & Budaya Lampung',
		tags: ['Prosa', 'Fiksi', 'Sastra Indonesia', 'Buku Ajar', 'UMKO'],
		synopsis:
			'Buku ini adalah sebagai panduan bagi setiap orang yang ingin mempelajari dan memperdalam ilmu pengetahuan mengenai kajian prosa fiksi dan apresiasi sastra.',
		toc: [
			{ title: 'Bab I: Hakikat Prosa Fiksi', page: 1 },
			{ title: 'Bab II: Unsur Intrinsik Karya Naratif', page: 25 },
			{ title: 'Bab III: Analisis Struktural Cerita Pendek dan Novel', page: 60 }
		],
		fileType: 'pdf',
		filePath: 'storage/books/Buku-KAJIAN-PROSA-FIKSI_Sri-Widayati_2020-1794187851181.pdf',
		coverUrl: '/api/covers/cover-Screenshot_20261109_083126-1794187938211.png',
		readersCount: 0,
		isSaved: true,
		isFeatured: true,
		createdAt: '2024-11-09'
	},
	{
		id: 2,
		title: 'SOSIO ANTROPOLOGI',
		slug: 'sosio-antropologi-u5sz',
		author: 'Yuli Laraenim, S.K.M., M.P.H.',
		publisher: 'Penerbit Yayasan Cendikia Mulia Mandiri',
		year: 2020,
		edition: 'Edisi Pertama',
		isbn: '',
		pages: 206,
		language: 'Bahasa Indonesia',
		classification: '370',
		ddcCode: '300',
		ddcName: 'Ilmu Sosial, Hukum & Pendidikan',
		category: 'Ilmu Sosial & Hukum',
		tags: ['Sosiologi', 'Antropologi', 'Ilmu Sosial', 'Kesehatan', 'Buku Ajar', 'UMKO'],
		synopsis:
			'Buku "Sosio Antropologi" merupakan buku referensi dan bahan ajar akademik terstandar pada bidang Ilmu Sosial & Hukum. Disusun secara sistematis guna memfasilitasi penguasaan konsep teoretis serta penerapan praktis bagi mahasiswa dan akademisi di lingkungan Universitas Muhammadiyah Kotabumi.',
		toc: [
			{ title: 'BAB I KONSEP DASAR SOSIOLOGI KESEHATAN', page: 1 },
			{ title: 'BAB II PROSES SOSIAL DAN INTERAKSI SOSIAL', page: 17 },
			{ title: 'BAB III PERUBAHAN SOSIAL BUDAYA MASYARAKAT', page: 29 },
			{ title: 'BAB IV KELOMPOK SOSIAL', page: 47 },
			{ title: 'BAB IX PERAN ANTROPOLOGI KESEHATAN', page: 151 }
		],
		fileType: 'pdf',
		filePath: 'storage/books/SOSIO-ANTROPOLOGI-1793692569101.pdf',
		coverUrl: '/api/covers/cover-cover-page1-SOSIO-ANTROPOLOGI-1793692567060.jpg',
		readersCount: 0,
		isSaved: true,
		isFeatured: true,
		createdAt: '2024-11-03'
	},
	{
		id: 3,
		title: 'Metodologi Penelitian Pendidikan Matematika dan Sains',
		slug: 'metodologi-penelitian-pendidikan-matematika-sains',
		author: 'Prof. Dr. Ir. H. Sudirman, M.Pd.',
		publisher: 'UMKO Press',
		year: 2024,
		edition: 'Edisi Ke-2 Revisi',
		isbn: '978-602-05-2418-4',
		pages: 342,
		language: 'Bahasa Indonesia',
		classification: '370.7',
		ddcCode: '370',
		ddcName: 'Pendidikan & Pedagogi',
		category: 'Pendidikan & Pedagogi',
		tags: ['Pendidikan', 'Metodologi Riset', 'Matematika', 'Statistika Kampus'],
		synopsis:
			'Buku ini menyajikan panduan sistematis mengenai perancangan eksperimen kuasi, pengembangan instrumen tes berpikir kritis, serta validasi instrumen pedagogis di ruang kelas. Dirancang khusus bagi mahasiswa FKIP yang sedang mempersiapkan proposal skripsi dan tesis.',
		toc: [
			{ title: 'Bab I: Paradigma Riset Pendidikan Abad ke-21', page: 1 },
			{ title: 'Bab II: Perumusan Masalah dan Variabel Penelitian', page: 48 },
			{ title: 'Bab III: Desain Eksperimen Kuasi dan Analisis Kovarian', page: 112 },
			{ title: 'Bab IV: Uji Reliabilitas Cronbach Alpha dan Validitas Konstruk', page: 198 },
			{ title: 'Bab V: Penulisan Laporan Ilmiah Sesuai Standar Akreditasi', page: 284 }
		],
		fileType: 'pdf',
		filePath: 'storage/books/metodologi-penelitian-pendidikan-matematika-sains.pdf',
		readersCount: 0,
		isSaved: true,
		isFeatured: false,
		createdAt: '2024-03-15'
	},
	{
		id: 4,
		title: 'Filsafat Kemuhammadiyahan: Tajdid dan Pencerahan Peradaban',
		slug: 'filsafat-kemuhammadiyahan-tajdid-dan-pencerahan',
		author: 'Drs. H. Mansyur Ibrahim, M.Ag.',
		publisher: 'Suara Muhammadiyah',
		year: 2022,
		edition: 'Cetakan Ke-3',
		isbn: '978-602-77-3811-9',
		pages: 290,
		language: 'Bahasa Indonesia',
		classification: '297.6',
		ddcCode: '200',
		ddcName: 'Agama & Studi Islam',
		category: 'Kemuhammadiyahan & Islam',
		tags: ['Kemuhammadiyahan', 'Tajdid', 'Islam Berkemajuan', 'Pemikiran'],
		synopsis:
			'Eksplorasi filosofis atas gerakan pembaruan (tajdid) Islam yang dirintis K.H. Ahmad Dahlan, relevansinya dalam etos keilmuan perguruan tinggi Muhammadiyah, serta tantangan modernitas abad ke-21.',
		toc: [
			{ title: 'Bab I: Landasan Teologis Teologi Al-Ma’un', page: 1 },
			{ title: 'Bab II: Gerakan Tajdid: Purifikasi dan Dinamisasi', page: 62 },
			{ title: 'Bab III: Manifestasi Amal Usaha dalam Bidang Pendidikan', page: 135 },
			{ title: 'Bab IV: Risalah Islam Berkemajuan', page: 210 }
		],
		fileType: 'epub',
		filePath: 'storage/books/filsafat-kemuhammadiyahan-tajdid-dan-pencerahan.epub',
		readersCount: 0,
		isSaved: false,
		isFeatured: false,
		createdAt: '2022-08-20'
	}
];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [];

export const INITIAL_SEARCH_LOGS: SearchLogItem[] = [];

export const INITIAL_ZERO_SEARCH_LOGS: SearchLogItem[] = [];

export const INITIAL_LIBRARY_SETTINGS: LibrarySettings = {
	name: 'ElibUMKO (Perpustakaan Digital UMKO)',
	institution: 'Universitas Muhammadiyah Kotabumi',
	title: 'Unit Pelaksana Teknis Perpustakaan Universitas Muhammadiyah Kotabumi',
	history:
		'Perpustakaan Universitas Muhammadiyah Kotabumi bertransformasi dari pusat rujukan cetak konvensional menjadi ekosistem literasi hibrida terpadu. ElibUMKO hadir guna memastikan setiap mahasiswa dan dosen memiliki akses setara terhadap buku teks bermutu tinggi dan literatur ilmiah di mana saja.',
	vision:
		'Menjadi pusat sumber belajar dan rujukan ilmiah berbasis teknologi informasi yang unggul, berkarakter Islami, dan berdaya saing nasional pada tahun 2030.',
	mission: [
		'Menyediakan koleksi sumber pustaka digital bermutu dan relevan dengan kurikulum keilmuan perguruan tinggi.',
		'Mengembangkan infrastruktur perpustakaan cerdas yang ramah pengguna, berkecepatan tinggi, dan terproteksi hak ciptanya.',
		'Meningkatkan literasi riset dan publikasi ilmiah sivitas akademika Universitas Muhammadiyah Kotabumi.'
	],
	hoursWeekday: 'Senin – Jumat: 08.00 – 16.00 WIB',
	hoursSaturday: 'Sabtu: 08.30 – 13.00 WIB (Minggu & Hari Libur Nasional Tutup)',
	phone: '(0724) 22894',
	email: 'perpustakaan@umko.ac.id',
	address:
		'Jl. Hasan Kepala Ratu No. 1052, Sindang Sari, Kec. Kotabumi, Kab. Lampung Utara, Lampung 34517',
	googleMapsUrl: 'https://maps.google.com/?q=Universitas+Muhammadiyah+Kotabumi',
	storageLimitGB: 50,
	storageDriver: 'local',
	customStoragePath: ''
};

export const INITIAL_LIBRARIAN_PROFILE: LibrarianProfile = {
	id: 'pustakawan-umko',
	name: 'Ilham Pangestu, S.Kom',
	email: 'pustakawan@umko.ac.id',
	role: 'Pustakawan Utama',
	nidn: '',
	phone: '',
	bio: 'Pustakawan Pengelola Perpustakaan Digital Universitas Muhammadiyah Kotabumi.',
	avatar: null,
	lastLogin: 'Baru saja'
};
