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

export interface ReadingTrendPoint {
	label: string;
	sessions: number;
	pagesRead: number;
}
