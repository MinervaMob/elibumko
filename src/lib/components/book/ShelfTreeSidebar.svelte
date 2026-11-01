<script lang="ts">
	import type { ClassificationNode } from '#lib/types';
	import { ChevronDown, ChevronRight, Folder, Library } from 'lucide-svelte';

	interface Props {
		activeCode?: string;
		tree?: ClassificationNode[];
		class?: string;
	}

	let { activeCode = '', tree = [], class: className = '' }: Props = $props();

	// Set of expanded parent class codes
	let expandedCodes = $state<Record<string, boolean>>({
		'000': true,
		'200': true,
		'300': true,
		'500': true
	});

	function toggleExpand(code: string) {
		expandedCodes[code] = !expandedCodes[code];
	}
</script>

<aside
	class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-4 shadow-xs {className}"
	aria-label="Pohon Klasifikasi DDC Perpustakaan"
>
	<div class="mb-3 flex items-center gap-2 border-b border-ink/15 pb-3">
		<Library size={18} class="text-brick" />
		<div>
			<h3 class="font-serif text-sm leading-tight font-bold text-ink">Pohon Klasifikasi DDC</h3>
			<span class="font-mono text-[10px] text-ink-muted uppercase">
				Dewey Decimal Classification
			</span>
		</div>
	</div>

	<!-- All books link -->
	<a
		href="/rak"
		class="focus-library mb-2 flex items-center justify-between rounded-sm px-2.5 py-2 text-xs font-semibold transition-colors {activeCode ===
		''
			? 'bg-brick text-cream'
			: 'text-ink hover:bg-sand/60'}"
	>
		<div class="flex items-center gap-2">
			<Folder size={14} class={activeCode === '' ? 'text-cream' : 'text-brick'} />
			<span>Semua Rak Buku</span>
		</div>
		<span
			class="rounded-xs px-1.5 py-0.5 font-mono text-[11px] {activeCode === ''
				? 'bg-black/20 text-cream'
				: 'bg-ink/10 text-ink-muted'}"
		>
			Total Koleksi
		</span>
	</a>

	<!-- Tree nodes -->
	<div class="space-y-1 text-xs">
		{#each tree as node (node.code)}
			{@const isExpanded = expandedCodes[node.code] ?? false}
			{@const isNodeActive = activeCode === node.code}

			<div class="overflow-hidden rounded-sm">
				<!-- Parent Class Row -->
				<div
					class="flex items-center justify-between rounded-sm px-2 py-1.5 transition-colors {isNodeActive
						? 'bg-brick text-cream'
						: 'text-ink hover:bg-sand/60'}"
				>
					<button
						type="button"
						onclick={() => toggleExpand(node.code)}
						class="focus-library mr-1 rounded p-0.5 hover:bg-black/10"
						aria-label={isExpanded ? 'Tutup subkelas' : 'Buka subkelas'}
					>
						{#if isExpanded}
							<ChevronDown size={14} />
						{:else}
							<ChevronRight size={14} />
						{/if}
					</button>

					<a
						href="/rak/{node.code}"
						class="focus-library flex flex-1 items-center gap-1.5 truncate font-medium"
					>
						<span
							class="font-mono text-[11px] font-bold {isNodeActive ? 'text-cream' : 'text-brick'}"
						>
							{node.code}
						</span>
						<span class="truncate">{node.name}</span>
					</a>

					<span
						class="py-0.2 ml-1 shrink-0 rounded-xs px-1.5 font-mono text-[10px] {isNodeActive
							? 'bg-black/20 text-cream'
							: 'bg-ink/10 text-ink-muted'}"
					>
						{node.count}
					</span>
				</div>

				<!-- Subclasses children (Indented) -->
				{#if isExpanded && node.subclasses}
					<div class="my-1 ml-3 space-y-1 border-l border-ink/15 py-1 pr-1 pl-6">
						{#each node.subclasses as sub (sub.code)}
							{@const isSubActive = activeCode === sub.code}
							<a
								href="/rak/{sub.code}"
								class="focus-library flex items-center justify-between rounded-xs px-2 py-1 text-[11px] transition-colors {isSubActive
									? 'bg-terracotta font-semibold text-cream'
									: 'text-ink-muted hover:bg-sand/50 hover:text-ink'}"
							>
								<div class="flex items-center gap-1.5 truncate">
									<span class="font-mono text-[10px] font-bold opacity-80">{sub.code}</span>
									<span class="truncate">{sub.name}</span>
								</div>
								<span
									class="ml-1 rounded px-1 font-mono text-[9px] {isSubActive
										? 'bg-black/20 text-cream'
										: 'bg-ink/5 text-ink-muted'}"
								>
									{sub.count}
								</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</aside>
