import type {
	BookData,
	CategoryData,
	ClassificationNode,
	ReadingTrendPoint,
	ActivityLogItem,
	SearchLogItem,
	LibrarySettings
} from '#lib/types';

export const INITIAL_DDC_TREE: ClassificationNode[] = [
	{
		code: '000',
		name: 'Karya Umum, Komputer & Informasi',
		count: 5,
		subclasses: [
			{ code: '004', name: 'Pemrosesan Data & Arsitektur Komputer', count: 2 },
			{ code: '005', name: 'Pemrograman, Algoritma & Perangkat Lunak', count: 3 }
		]
	},
	{
		code: '100',
		name: 'Filsafat & Etika Keilmuan',
		count: 3,
		subclasses: [{ code: '170', name: 'Etika Profesi & Filsafat Moral', count: 3 }]
	},
	{
		code: '200',
		name: 'Agama & Studi Islam',
		count: 6,
		subclasses: [
			{ code: '297.1', name: "Al-Qur'an dan Hadis Kontemporer", count: 2 },
			{ code: '297.6', name: 'Kemuhammadiyahan, Tarjih & Tajdid', count: 4 }
		]
	},
	{
		code: '300',
		name: 'Ilmu Sosial, Hukum & Pendidikan',
		count: 12,
		subclasses: [
			{ code: '340', name: 'Ilmu Hukum & Peradilan Indonesia', count: 4 },
			{ code: '370', name: 'Pendidikan Dasar & Teori Pedagogi', count: 5 },
			{ code: '371', name: 'Manajemen Sekolah & Profesi Pendidik', count: 3 }
		]
	},
	{
		code: '400',
		name: 'Bahasa & Linguistik Nusantara',
		count: 4,
		subclasses: [
			{ code: '410', name: 'Linguistik Teoretis & Terapan', count: 2 },
			{ code: '499.2', name: 'Bahasa & Sastra Lampung Tradisional', count: 2 }
		]
	},
	{
		code: '500',
		name: 'Sains Murni & Matematika',
		count: 5,
		subclasses: [
			{ code: '510', name: 'Aljabar & Analisis Real Matematika', count: 2 },
			{ code: '519', name: 'Statistika Terapan & Probabilitas Riset', count: 3 }
		]
	},
	{
		code: '600',
		name: 'Teknologi & Ilmu Terapan',
		count: 5,
		subclasses: [
			{ code: '650', name: 'Kewirausahaan & Manajemen UMKM', count: 2 },
			{ code: '658', name: 'Manajemen Keuangan & Perbankan Syariah', count: 3 }
		]
	}
];

export const INITIAL_CATEGORIES: CategoryData[] = [
	{
		code: '000',
		name: 'Komputer & Sains Data',
		count: 5,
		color: 'brick',
		description: 'Algoritma, pemrograman, keamanan jaringan, dan kecerdasan artifisial.'
	},
	{
		code: '100',
		name: 'Filsafat & Etika',
		count: 3,
		color: 'terracotta',
		description: 'Logika epistemologi dan etika profesi akademik.'
	},
	{
		code: '297',
		name: 'Kemuhammadiyahan & Islam',
		count: 6,
		color: 'ink',
		description: 'Kajian tajdid, pemikiran K.H. Ahmad Dahlan, dan fiqih peradaban.'
	},
	{
		code: '300',
		name: 'Ilmu Sosial & Hukum',
		count: 6,
		color: 'sand',
		description: 'Hukum tata negara, perdata, pidana, dan administrasi publik.'
	},
	{
		code: '370',
		name: 'Pendidikan & Pedagogi',
		count: 8,
		color: 'brick',
		description: 'Metodologi pembelajaran, evaluasi pendidikan, dan kurikulum Merdeka.'
	},
	{
		code: '400',
		name: 'Bahasa & Budaya Lampung',
		count: 4,
		color: 'terracotta',
		description: 'Kajian linguistik Austronesia, fonologi, dan pelestarian aksara Lampung.'
	},
	{
		code: '500',
		name: 'Sains & Matematika',
		count: 5,
		color: 'sand',
		description: 'Analisis kalkulus, statistika penelitian kuantitatif, dan fisika komputasi.'
	},
	{
		code: '650',
		name: 'Manajemen & Ekonomi Syariah',
		count: 5,
		color: 'ink',
		description: 'Lembaga keuangan mikro syariah, tata kelola bisnis, dan kewirausahaan.'
	}
];

export const INITIAL_BOOKS: BookData[] = [
	{
		id: 1,
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
		ddcName: 'Pendidikan',
		category: 'Pendidikan',
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
		readersCount: 1420,
		isSaved: true,
		isFeatured: true,
		createdAt: '2024-03-15'
	},
	{
		id: 2,
		title: 'Algoritma Komputasi dan Struktur Data Modern',
		slug: 'algoritma-komputasi-dan-struktur-data-modern',
		author: 'Ir. Ahmad Zarkasih, M.T.',
		publisher: 'Penerbit Pustaka Kampus',
		year: 2023,
		edition: 'Edisi Pertama',
		isbn: '978-602-88-1290-1',
		pages: 418,
		language: 'Bahasa Indonesia',
		classification: '005.1',
		ddcCode: '000',
		ddcName: 'Karya Umum & Komputer',
		category: 'Ilmu Komputer',
		tags: ['Algoritma', 'Struktur Data', 'Komputasi', 'Pemrograman'],
		synopsis:
			'Membahas konsep mendasar struktur data linier dan non-linier, analisis asimtotik Big-O, graf rekursif, algoritma greedy, serta pemrograman dinamis dengan implementasi efisien untuk sistem perangkat lunak modern.',
		toc: [
			{ title: 'Bab I: Analisis Kompleksitas Waktu dan Ruang', page: 1 },
			{ title: 'Bab II: Linked List, Stack, dan Queue Teroptimasi', page: 56 },
			{ title: 'Bab III: Pohon Biner Seimbang dan Trie', page: 142 },
			{ title: 'Bab IV: Algoritma Graph (Dijkstra, Bellman-Ford, Kruskal)', page: 230 },
			{ title: 'Bab V: Dynamic Programming dan Memoization', page: 325 }
		],
		readersCount: 2840,
		isFeatured: true,
		createdAt: '2023-11-10'
	},
	{
		id: 3,
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
		ddcName: 'Agama & Islam',
		category: 'Studi Islam',
		tags: ['Kemuhammadiyahan', 'Tajdid', 'Islam Berkemajuan', 'Pemikiran'],
		synopsis:
			'Eksplorasi filosofis atas gerakan pembaruan (tajdid) Islam yang dirintis K.H. Ahmad Dahlan, relevansinya dalam etos keilmuan perguruan tinggi Muhammadiyah, serta tantangan modernitas abad ke-21.',
		toc: [
			{ title: 'Bab I: Landasan Teologis Teologi Al-Ma’un', page: 1 },
			{ title: 'Bab II: Gerakan Tajdid: Purifikasi dan Dinamisasi', page: 62 },
			{ title: 'Bab III: Manifestasi Amal Usaha dalam Bidang Pendidikan', page: 135 },
			{ title: 'Bab IV: Risalah Islam Berkemajuan', page: 210 }
		],
		readersCount: 3105,
		isSaved: false,
		isFeatured: true,
		createdAt: '2022-08-20'
	},
	{
		id: 4,
		title: 'Hukum Tata Usaha Negara dan Praktik Peradilan Indonesia',
		slug: 'hukum-tata-usaha-negara-praktik-peradilan',
		author: 'Dr. Hendra Wijaya, S.H., M.H.',
		publisher: 'RajaGrafindo Persada',
		year: 2023,
		edition: 'Edisi Ke-2',
		isbn: '978-979-769-940-2',
		pages: 356,
		language: 'Bahasa Indonesia',
		classification: '342.598',
		ddcCode: '300',
		ddcName: 'Ilmu Sosial & Hukum',
		category: 'Hukum',
		tags: ['Hukum Tata Usaha', 'PTUN', 'Administrasi Negara', 'Peradilan'],
		synopsis:
			'Analisis mendalam mengenai sumber wewenang pejabat publik, asas-asas umum pemerintahan yang baik (AUPB), sengketa keputusan tata usaha negara, dan tahapan proses beracara di Pengadilan Tata Usaha Negara.',
		toc: [
			{ title: 'Bab I: Konsep Kekuasaan dan Hukum Administrasi', page: 1 },
			{ title: 'Bab II: Tindakan Hukum Pemerintahan dan Diskresi', page: 74 },
			{ title: 'Bab III: Asas-Asas Umum Pemerintahan yang Baik', page: 156 },
			{ title: 'Bab IV: Hukum Acara Peradilan Tata Usaha Negara', page: 242 }
		],
		readersCount: 1890,
		isSaved: true,
		createdAt: '2023-05-18'
	},
	{
		id: 5,
		title: 'Manajemen Keuangan Syariah dan Pembiayaan Mikro',
		slug: 'manajemen-keuangan-syariah-pembiayaan-mikro',
		author: 'Dr. Nurul Hidayah, S.E., M.Si.',
		publisher: 'Salemba Empat',
		year: 2024,
		edition: 'Edisi Pertama',
		isbn: '978-979-061-820-5',
		pages: 278,
		language: 'Bahasa Indonesia',
		classification: '658.15',
		ddcCode: '600',
		ddcName: 'Teknologi & Manajemen',
		category: 'Ekonomi',
		tags: ['Keuangan Syariah', 'BMT', 'Ekonomi Islam', 'Manajemen'],
		synopsis:
			'Panduan operasional dan teoretis tata kelola lembaga keuangan mikro syariah (BMT), akad murabahah, mudharabah, musyarakah, serta mitigasi risiko pembiayaan usaha kecil masyarakat di Lampung Utara.',
		toc: [
			{ title: 'Bab I: Rancang Bangun Sistem Moneter Syariah', page: 1 },
			{ title: 'Bab II: Fiqih Muamalah Finansial Kontemporer', page: 54 },
			{ title: 'Bab III: Manajemen Portofolio dan Analisis Kelayakan', page: 120 },
			{ title: 'Bab IV: Mitigasi Risiko Kredit dan NPF', page: 198 }
		],
		readersCount: 2240,
		createdAt: '2024-01-22'
	},
	{
		id: 6,
		title: 'Linguistik Komparatif Bahasa Nusantara dan Bahasa Lampung',
		slug: 'linguistik-komparatif-bahasa-nusantara-lampung',
		author: 'Dra. Siti Rahmah, M.Hum.',
		publisher: 'UMKO Press',
		year: 2021,
		edition: 'Edisi Pertama',
		isbn: '978-602-05-1892-3',
		pages: 214,
		language: 'Bahasa Indonesia',
		classification: '499.2',
		ddcCode: '400',
		ddcName: 'Bahasa & Linguistik',
		category: 'Bahasa & Sastra',
		tags: ['Bahasa Lampung', 'Linguistik Komparatif', 'Aksara Kaganga', 'Filologi'],
		synopsis:
			'Kajian dialektologi dialek Api dan dialek Nyo di Kabupaten Lampung Utara, relasi fonologis dengan rumpun Austronesia Barat, serta teknik transliterasi aksara Lampung (Had Lampung) ke dalam sistem fonetis internasional.',
		toc: [
			{ title: 'Bab I: Sejarah Rumpun Bahasa Lampung dalam Austronesia', page: 1 },
			{ title: 'Bab II: Fonologi dan Morfofonemik Dialek Api dan Nyo', page: 44 },
			{ title: 'Bab III: Aksara Had Lampung dan Filologi Manuskrip Kuno', page: 110 },
			{ title: 'Bab IV: Revitalisasi Bahasa Daerah di Lembaga Pendidikan', page: 165 }
		],
		readersCount: 975,
		createdAt: '2021-09-14'
	},
	{
		id: 7,
		title: 'Statistika Inferensial untuk Skripsi dan Tesis Kuantitatif',
		slug: 'statistika-inferensial-skripsi-tesis-kuantitatif',
		author: 'Bambang Irawan, M.Stat.',
		publisher: 'Pustaka Pelajar',
		year: 2024,
		edition: 'Edisi Ke-3',
		isbn: '978-602-229-450-8',
		pages: 388,
		language: 'Bahasa Indonesia',
		classification: '519.5',
		ddcCode: '500',
		ddcName: 'Sains & Matematika',
		category: 'Sains',
		tags: ['Statistika', 'Regresi Berganda', 'ANOVA', 'Skripsi'],
		synopsis:
			'Buku pegangan uji hipotesis, regresi linear berganda, analisis varians (ANOVA satu dan dua arah), uji mediasi Sobel, dan analisis jalur (path analysis) dilengkapi contoh dataset riil.',
		toc: [
			{ title: 'Bab I: Uji Normalitas, Homogenitas dan Linieritas Data', page: 1 },
			{ title: 'Bab II: Uji Beda Parametrik dan Non-Parametrik', page: 68 },
			{ title: 'Bab III: Pemodelan Regresi Berganda Terapan', page: 154 },
			{ title: 'Bab IV: Structural Equation Modeling Dasar (PLS-SEM)', page: 250 }
		],
		readersCount: 3580,
		isFeatured: true,
		createdAt: '2024-02-05'
	},
	{
		id: 8,
		title: 'Etika Profesi Keguruan di Era Kecerdasan Artifisial',
		slug: 'etika-profesi-keguruan-era-ai',
		author: 'Prof. Dr. Hj. Nurjanah, M.Pd.',
		publisher: 'UMKO Press',
		year: 2024,
		edition: 'Edisi Pertama',
		isbn: '978-602-05-2560-0',
		pages: 254,
		language: 'Bahasa Indonesia',
		classification: '371.1',
		ddcCode: '300',
		ddcName: 'Ilmu Sosial & Pendidikan',
		category: 'Pendidikan',
		tags: ['Etika Guru', 'Kecerdasan Artifisial', 'Pedagogi Digital', 'FKIP'],
		synopsis:
			'Membahas batas integritas akademik pemanfaatan generative AI dalam penyusunan modul ajar, asesmen siswa, serta penjagaan marwah profesi guru sebagai teladan moral di sekolah.',
		toc: [
			{ title: 'Bab I: Landasan Filosofis Etika Pendidik Muhammadiyah', page: 1 },
			{ title: 'Bab II: Disrupsi Teknologi Kecerdasan Artifisial di Kelas', page: 58 },
			{ title: 'Bab III: Standar Integritas Ilmiah Penyusunan Bahan Ajar', page: 122 },
			{ title: 'Bab IV: Kode Etik Guru Indonesia dan Penegakannya', page: 186 }
		],
		readersCount: 1650,
		createdAt: '2024-04-12'
	},
	{
		id: 9,
		title: 'Rekayasa Perangkat Lunak Berorientasi Objek dengan UML',
		slug: 'rekayasa-perangkat-lunak-berorientasi-objek-uml',
		author: 'Fajar Nugraha, S.Kom., M.Cs.',
		publisher: 'Informatika Press',
		year: 2023,
		edition: 'Edisi Ke-2',
		isbn: '978-623-7131-45-1',
		pages: 360,
		language: 'Bahasa Indonesia',
		classification: '005.117',
		ddcCode: '000',
		ddcName: 'Karya Umum & Komputer',
		category: 'Ilmu Komputer',
		tags: ['RPL', 'UML', 'Design Patterns', 'Software Engineering'],
		synopsis:
			'Pendekatan praktis siklus hidup pengembangan perangkat lunak (SDLC), analisis kebutuhan pengguna, diagram use case, diagram aktivitas, diagram kelas, dan penerapan design patterns gang-of-four.',
		toc: [
			{ title: 'Bab I: Metodologi Agile vs Waterfall dalam Praktik', page: 1 },
			{ title: 'Bab II: Pemodelan Berorientasi Objek dengan UML 2.5', page: 65 },
			{ title: 'Bab III: Arsitektur Perangkat Lunak MVC dan Clean Architecture', page: 160 },
			{ title: 'Bab IV: Pengujian Perangkat Lunak (Black Box & White Box)', page: 260 }
		],
		readersCount: 1720,
		createdAt: '2023-10-02'
	},
	{
		id: 10,
		title: 'Kemuhammadiyahan: Gerakan Islam, Dakwah, dan Tajdid',
		slug: 'kemuhammadiyahan-gerakan-islam-dakwah-tajdid',
		author: 'Majelis Pendidikan Tinggi Litbang PP Muhammadiyah',
		publisher: 'Suara Muhammadiyah',
		year: 2023,
		edition: 'Buku Teks Wajib Al-Islam Kemuhammadiyahan',
		isbn: '978-602-0869-78-2',
		pages: 310,
		language: 'Bahasa Indonesia',
		classification: '297.61',
		ddcCode: '200',
		ddcName: 'Agama & Islam',
		category: 'Studi Islam',
		tags: ['AIK', 'Mata Kuliah Wajib', 'Muhammadiyah', 'Dakwah'],
		synopsis:
			'Buku daras resmi mata kuliah Al-Islam dan Kemuhammadiyahan (AIK) bagi mahasiswa perguruan tinggi Muhammadiyah se-Indonesia, mencakup profil K.H. Ahmad Dahlan, kepribadian Muhammadiyah, dan matan keyakinan.',
		toc: [
			{ title: 'Bab I: Latar Belakang Kelahiran Gerakan Muhammadiyah', page: 1 },
			{ title: 'Bab II: Matan Keyakinan dan Cita-Cita Hidup Muhammadiyah', page: 70 },
			{ title: 'Bab III: Khittah Perjuangan dan Kepribadian Muhammadiyah', page: 145 },
			{ title: 'Bab IV: Peran Kebangsaan Muhammadiyah untuk Indonesia', page: 228 }
		],
		readersCount: 4210,
		isFeatured: true,
		createdAt: '2023-07-19'
	},
	{
		id: 11,
		title: 'Hukum Perjanjian dan Kontrak Bisnis di Indonesia',
		slug: 'hukum-perjanjian-dan-kontrak-bisnis-indonesia',
		author: 'Dedy Kurniawan, S.H., M.Kn.',
		publisher: 'Sinar Grafika',
		year: 2022,
		edition: 'Edisi Pertama',
		isbn: '978-979-007-889-4',
		pages: 286,
		language: 'Bahasa Indonesia',
		classification: '346.02',
		ddcCode: '300',
		ddcName: 'Ilmu Sosial & Hukum',
		category: 'Hukum',
		tags: ['Hukum Kontrak', 'Perjanjian', 'KUH Perdata', 'Bisnis'],
		synopsis:
			'Kajian yuridis syarat sahnya perjanjian Pasal 1320 KUHPerdata, klausula baku, wanprestasi, keadaan memaksa (force majeure), serta teknik penyusunan draft kontrak bisnis yang aman dan presisi.',
		toc: [
			{ title: 'Bab I: Asas-Asas Hukum Perikatan', page: 1 },
			{ title: 'Bab II: Anatomi dan Klausul Krusial Perjanjian', page: 60 },
			{ title: 'Bab III: Wanprestasi dan Upaya Ganti Kerugian', page: 138 },
			{ title: 'Bab IV: Penyelesaian Sengketa Kontrak Melalui Arbitrase', page: 215 }
		],
		readersCount: 1350,
		createdAt: '2022-11-28'
	},
	{
		id: 12,
		title: 'Kalkulus Diferensial dan Integral Terapan',
		slug: 'kalkulus-diferensial-dan-integral-terapan',
		author: 'Rina Marlina, S.Si., M.Sc.',
		publisher: 'Penerbit Erlangga',
		year: 2023,
		edition: 'Edisi Ke-4',
		isbn: '978-602-434-601-0',
		pages: 440,
		language: 'Bahasa Indonesia',
		classification: '515.3',
		ddcCode: '500',
		ddcName: 'Sains & Matematika',
		category: 'Sains',
		tags: ['Kalkulus', 'Turunan', 'Integral', 'Matematika Murni'],
		synopsis:
			'Pembahasan komprehensif konsep limit, kontinuitas fungsi, turunan fungsi aljabar dan transenden, integral tentu dan tak tentu, teorema dasar kalkulus, serta aplikasi kalkulus pada laju perubahan fisik.',
		toc: [
			{ title: 'Bab I: Sistem Bilangan Real dan Konsep Limit', page: 1 },
			{ title: 'Bab II: Diferensial dan Aturan Rantai', page: 85 },
			{ title: 'Bab III: Aplikasi Turunan pada Nilai Ekstrem', page: 175 },
			{ title: 'Bab IV: Integral Riil dan Teknik Pengintegralan', page: 270 },
			{ title: 'Bab V: Volume Benda Putar dan Panjang Busur', page: 360 }
		],
		readersCount: 2490,
		createdAt: '2023-03-12'
	},
	{
		id: 13,
		title: 'Sosio Antropologi',
		slug: 'sosio-antropologi-u5sz',
		author: 'Yuli Laraenim S.K.M., M.P.H, dkk.',
		publisher: 'Penerbit Yayasan Cendikia Mulia Mandiri',
		year: 2024,
		edition: 'Edisi Pertama',
		pages: 206,
		language: 'Bahasa Indonesia',
		classification: '300',
		ddcCode: '300',
		ddcName: 'Ilmu Sosial, Hukum & Pendidikan',
		category: 'Ilmu Sosial & Hukum',
		tags: ['Sosiologi', 'Antropologi', 'Ilmu Sosial', 'Kesehatan', 'Buku Ajar', 'UMKO'],
		synopsis:
			'Buku "Sosio Antropologi" merupakan buku referensi dan bahan ajar akademik terstandar pada bidang Ilmu Sosial & Hukum. Disusun secara sistematis guna memfasilitasi penguasaan konsep teoretis serta penerapan praktis bagi mahasiswa dan akademisi di lingkungan Universitas Muhammadiyah Kotabumi.',
		toc: [
			{ title: 'BAB I KONSEP DASAR SOSIOLOGI KESEHATAN', page: 10 },
			{ title: 'BAB II PROSES SOSIAL DAN INTERAKSI SOSIAL', page: 26 },
			{ title: 'BAB III PERUBAHAN SOSIAL BUDAYA MASYARAKAT', page: 38 },
			{ title: 'BAB IV KELOMPOK SOSIAL', page: 56 },
			{ title: 'BAB V DETERMINAN SOSIAL DALAM KESEHATAN MASYARAKAT', page: 70 },
			{ title: 'BAB VI PENDEKATAN SOSIAL DALAM KESEHATAN MASYARAKAT', page: 94 },
			{ title: 'BAB VII KONSEP BUDAYA, UNSUR BUDAYA DAN MASYARAKAT', page: 126 },
			{ title: 'BAB VIII DETERMINAN BUDAYA DALAM KESEHATAN MASYARAKAT', page: 142 },
			{ title: 'BAB IX PERAN ANTROPOLOGI KESEHATAN', page: 160 },
			{ title: 'BAB X PENDEKATAN ANTROPOLOGI DALAM KESEHATAN MASYARAKAT', page: 174 },
			{ title: 'DAFTAR PUSTAKA', page: 194 }
		],
		fileType: 'pdf',
		filePath: 'storage/books/SOSIO-ANTROPOLOGI-1793692569101.pdf',
		coverUrl: '/api/covers/cover-cover-page1-SOSIO-ANTROPOLOGI-1793692567060.jpg',
		readersCount: 42,
		isSaved: true,
		isFeatured: true,
		createdAt: '2024-11-03'
	}
];

export const INITIAL_ADMIN_STATS = {
	totalBooks: 1428,
	booksTrend: '+12 judul bulan ini',
	activeReaders: 3892,
	readersTrend: '+18.4% semester ini',
	totalReadingSessions: 48210,
	sessionsTrend: '+24.1% bulan ini',
	storageUsedGB: 14.8,
	storageLimitGB: 50.0,
	storagePercent: 29.6,
	totalPdfBooks: 1142,
	totalEpubBooks: 286
};

export const INITIAL_READING_TREND: ReadingTrendPoint[] = [
	{ label: 'Sen', sessions: 620, pagesRead: 4820 },
	{ label: 'Sel', sessions: 780, pagesRead: 6140 },
	{ label: 'Rab', sessions: 890, pagesRead: 7250 },
	{ label: 'Kam', sessions: 840, pagesRead: 6980 },
	{ label: 'Jum', sessions: 540, pagesRead: 4210 },
	{ label: 'Sab', sessions: 390, pagesRead: 2950 },
	{ label: 'Min', sessions: 460, pagesRead: 3410 }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
	{
		id: 'act-1',
		action: 'upload',
		description: 'Mengunggah berkas naskah PDF buku baru (342 hlm)',
		targetTitle: 'Metodologi Penelitian Pendidikan Matematika dan Sains',
		targetSlug: 'metodologi-penelitian-pendidikan-matematika-sains',
		userName: 'Drs. H. Mulyadi, M.Pd.',
		timestamp: '14 menit lalu'
	},
	{
		id: 'act-2',
		action: 'update',
		description: 'Memperbarui metadata ISBN dan daftar isi bab',
		targetTitle: 'Filsafat Kemuhammadiyahan: Tajdid dan Pencerahan',
		targetSlug: 'filsafat-kemuhammadiyahan-tajdid-dan-pencerahan',
		userName: 'Siti Rohmah, S.I.Pust.',
		timestamp: '2 jam lalu'
	},
	{
		id: 'act-3',
		action: 'system',
		description: 'Pencadangan harian basis data dan storage terproteksi selesai',
		userName: 'Sistem Otomatis',
		timestamp: '03:00 WIB'
	},
	{
		id: 'act-4',
		action: 'upload',
		description: 'Mengunggah versi EPUB untuk pembaca layar sentuh',
		targetTitle: 'Pengantar Ilmu Hukum Indonesia',
		targetSlug: 'pengantar-ilmu-hukum-indonesia',
		userName: 'Drs. H. Mulyadi, M.Pd.',
		timestamp: 'Kemarin'
	},
	{
		id: 'act-5',
		action: 'update',
		description: 'Mengubah klasifikasi DDC 370.7 ke 370.1 Teori Pendidikan',
		targetTitle: 'Psikologi Pendidikan dan Pembelajaran Abad 21',
		targetSlug: 'psikologi-pendidikan-dan-pembelajaran-abad-21',
		userName: 'Siti Rohmah, S.I.Pust.',
		timestamp: '2 hari lalu'
	}
];

export const INITIAL_SEARCH_LOGS: SearchLogItem[] = [
	{
		id: 's-1',
		query: 'metodologi penelitian kualitatif',
		count: 342,
		resultsCount: 8,
		lastSearched: '5 mnt lalu'
	},
	{
		id: 's-2',
		query: 'hukum perdata bisnis',
		count: 215,
		resultsCount: 5,
		lastSearched: '12 mnt lalu'
	},
	{
		id: 's-3',
		query: 'kemuhammadiyahan ahmad dahlan',
		count: 189,
		resultsCount: 6,
		lastSearched: '24 mnt lalu'
	},
	{
		id: 's-4',
		query: 'algoritma struktur data python',
		count: 164,
		resultsCount: 4,
		lastSearched: '1 jam lalu'
	},
	{
		id: 's-5',
		query: 'pendidikan inklusif anak usia dini',
		count: 142,
		resultsCount: 3,
		lastSearched: '2 jam lalu'
	}
];

export const INITIAL_ZERO_SEARCH_LOGS: SearchLogItem[] = [
	{
		id: 'z-1',
		query: 'kecerdasan buatan hukum kesehatan',
		count: 86,
		resultsCount: 0,
		lastSearched: '18 mnt lalu'
	},
	{
		id: 'z-2',
		query: 'keperawatan gerontik lansia lampung',
		count: 64,
		resultsCount: 0,
		lastSearched: '45 mnt lalu'
	},
	{
		id: 'z-3',
		query: 'akuntansi forensik dan audit fraud',
		count: 52,
		resultsCount: 0,
		lastSearched: '2 jam lalu'
	},
	{
		id: 'z-4',
		query: 'hukum tata ruang pertanahan uupa 2024',
		count: 47,
		resultsCount: 0,
		lastSearched: '3 jam lalu'
	},
	{
		id: 'z-5',
		query: 'manajemen rantai pasok kopi robusta',
		count: 39,
		resultsCount: 0,
		lastSearched: 'Kemarin'
	}
];

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
	storageLimitGB: 50
};
