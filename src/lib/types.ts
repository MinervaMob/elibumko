export interface TableOfContentItem {
	title: string;
	page: number;
	children?: TableOfContentItem[];
}

export interface BookData {
	id: string | number;
	title: string;
	slug: string;
	author: string;
	publisher?: string | null;
	year?: number | string | null;
	edition?: string | null;
	isbn?: string | null;
	pages?: number | null;
	language?: string | null;
	coverUrl?: string | null;
	classification?: string | null; // e.g. "370.7"
	ddcCode?: string | null; // e.g. "300" or "370"
	ddcName?: string | null; // e.g. "Pendidikan"
	category?: string | null;
	tags?: string[];
	synopsis?: string | null;
	toc?: TableOfContentItem[];
	readersCount?: number | null;
	isSaved?: boolean;
	isFeatured?: boolean | null;
	fileType?: 'pdf' | 'epub' | 'docx';
	fileUrl?: string | null;
	filePath?: string | null;
	fileSize?: number | null;
	createdAt?: string;
	deletedAt?: Date | string | null;
}

export interface CategoryData {
	code: string;
	name: string;
	count: number;
	color: 'brick' | 'terracotta' | 'sand' | 'ink';
	description?: string;
}

export interface ClassificationNode {
	code: string;
	name: string;
	count: number;
	description?: string;
	color?: 'brick' | 'terracotta' | 'sand' | 'ink';
	isCustom?: boolean;
	subclasses?: {
		code: string;
		name: string;
		count: number;
	}[];
}

export interface ActivityLogItem {
	id: string;
	action: 'upload' | 'update' | 'delete' | 'system';
	description: string;
	targetTitle?: string;
	targetSlug?: string;
	userName: string;
	timestamp: string;
}

export interface SearchLogItem {
	id: string;
	query: string;
	count: number;
	resultsCount: number;
	lastSearched: string;
}

export interface LogStats {
	activityLogCount: number;
	maxActivityLogs: number;
	popularSearchCount: number;
	zeroSearchCount: number;
	estimatedSizeBytes: number;
	retentionPolicy: string;
}

export interface ReadingTrendPoint {
	label: string;
	sessions: number;
	pagesRead: number;
}

export interface ReadingSessionRecord {
	id: string;
	bookSlug: string;
	deviceHash: string;
	role: 'mahasiswa' | 'dosen' | 'umum';
	pagesRead: number;
	createdAt: string;
	lastActivityAt: string;
}

export interface AdminStats {
	totalBooks: number;
	totalPdfBooks: number;
	totalEpubBooks: number;
	totalReaders: number;
	activeReaders: number;
	booksTrend: string;
	readersTrend: string;
	totalReadingSessions: number;
	sessionsTrend: string;
	storageUsedGB: number;
	storageLimitGB: number;
	storagePercent: number;
	readerDemographics: {
		mahasiswa: number;
		dosen: number;
		umum: number;
	};
}

export interface LibraryProfile {
	name: string;
	institution: string;
	title: string;
	history: string;
	vision: string;
	mission: string[];
	hoursWeekday: string;
	hoursSaturday: string;
	phone: string;
	email: string;
	address: string;
	googleMapsUrl: string;
}

export interface LibrarySettings extends LibraryProfile {
	storageLimitGB: number;
	storageDriver: 'local' | 'custom_local' | 's3_minio';
	customStoragePath?: string;
	s3Endpoint?: string;
	s3Bucket?: string;
}

export interface LibrarianProfile {
	id: string;
	name: string;
	email: string;
	role: string;
	nidn?: string;
	phone?: string;
	avatar?: string | null;
	bio?: string;
	lastLogin?: string;
}
