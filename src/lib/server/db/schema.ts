import { pgTable, serial, integer, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { TableOfContentItem, LibrarySettings } from '#lib/types';

export const books = pgTable('books', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	author: text('author').notNull(),
	publisher: text('publisher'),
	year: integer('year'),
	edition: text('edition'),
	isbn: text('isbn'),
	pages: integer('pages'),
	language: text('language').default('Bahasa Indonesia'),
	coverUrl: text('cover_url'),
	classification: text('classification'),
	ddcCode: text('ddc_code'),
	ddcName: text('ddc_name'),
	category: text('category'),
	tags: jsonb('tags').$type<string[]>().default([]),
	synopsis: text('synopsis'),
	toc: jsonb('toc').$type<TableOfContentItem[]>().default([]),
	readersCount: integer('readers_count').default(0),
	isFeatured: boolean('is_featured').default(false),
	fileType: text('file_type').$type<'pdf' | 'epub' | 'docx'>().default('pdf'),
	filePath: text('file_path'),
	fileSize: integer('file_size'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at') // Soft delete
});

export const classifications = pgTable('classifications', {
	code: text('code').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	color: text('color').$type<'brick' | 'terracotta' | 'sand' | 'ink'>().default('brick'),
	parentCode: text('parent_code'),
	count: integer('count').default(0),
	sortOrder: integer('sort_order').default(0)
});

export const activityLogs = pgTable('activity_logs', {
	id: text('id').primaryKey(),
	action: text('action').$type<'upload' | 'update' | 'delete' | 'system'>().notNull(),
	description: text('description').notNull(),
	targetTitle: text('target_title'),
	targetSlug: text('target_slug'),
	userName: text('user_name').notNull().default('Drs. H. Mulyadi, M.Pd.'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const searchLogs = pgTable('search_logs', {
	id: text('id').primaryKey(),
	query: text('query').notNull().unique(),
	count: integer('count').default(1).notNull(),
	resultsCount: integer('results_count').default(0).notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const librarySettings = pgTable('library_settings', {
	key: text('key').primaryKey(),
	data: jsonb('data').$type<LibrarySettings>().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Legacy table for migration compatibility
export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export * from './auth.schema';
