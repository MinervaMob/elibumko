<script lang="ts">
	import { History, Upload, FilePenLine, Database, Trash2, ArrowUpRight } from 'lucide-svelte';
	import type { ActivityLogItem } from '#lib/types';

	interface Props {
		activities: ActivityLogItem[];
		class?: string;
	}

	let { activities, class: className = '' }: Props = $props();

	function getActionIcon(action: ActivityLogItem['action']) {
		switch (action) {
			case 'upload':
				return Upload;
			case 'update':
				return FilePenLine;
			case 'delete':
				return Trash2;
			case 'system':
				return Database;
			default:
				return History;
		}
	}

	function getActionBadge(action: ActivityLogItem['action']) {
		switch (action) {
			case 'upload':
				return { label: 'Unggah', bg: 'bg-brick/15 text-brick' };
			case 'update':
				return { label: 'Sunting', bg: 'bg-terracotta/20 text-terracotta' };
			case 'delete':
				return { label: 'Hapus', bg: 'bg-ink/15 text-ink' };
			case 'system':
				return { label: 'Sistem', bg: 'bg-sand text-ink-muted' };
		}
	}
</script>

<div
	class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6 {className}"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-ink/15 pb-3">
		<div class="flex items-center gap-2">
			<History size={18} class="text-brick" />
			<h3 class="font-serif text-base font-bold text-ink sm:text-lg">
				Aktivitas Pustakawan Terkini
			</h3>
		</div>
		<a
			href="/admin/aktivitas"
			class="focus-library rounded text-xs font-semibold text-brick hover:underline"
		>
			Lihat Semua Log →
		</a>
	</div>

	<!-- Activity Timeline -->
	<div class="mt-4 space-y-4">
		{#each activities as act (act.id)}
			{@const Icon = getActionIcon(act.action)}
			{@const badge = getActionBadge(act.action)}
			<div class="group flex items-start gap-3">
				<!-- Icon pill -->
				<div class="shrink-0 rounded-md border border-ink/10 p-2 {badge.bg}" title={badge.label}>
					<Icon size={15} />
				</div>

				<!-- Content -->
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between gap-2">
						<span class="truncate text-xs font-semibold text-ink sm:text-sm">
							{act.userName}
						</span>
						<span class="shrink-0 font-mono text-[10px] text-ink-muted">
							{act.timestamp}
						</span>
					</div>

					<p class="mt-0.5 text-xs leading-snug text-ink-muted">
						{act.description}
					</p>

					{#if act.targetTitle}
						<div class="mt-1">
							<a
								href="/buku/{act.targetSlug}"
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 font-serif text-[11px] leading-tight font-bold text-brick hover:underline"
							>
								<span class="truncate">{act.targetTitle}</span>
								<ArrowUpRight size={11} class="shrink-0" />
							</a>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
