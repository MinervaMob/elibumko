<script lang="ts">
	import type { CategoryData } from '#lib/types';
	import CategoryChip from '#lib/components/ui/CategoryChip.svelte';
	import { ArrowRight, Library } from 'lucide-svelte';

	interface Props {
		categories?: CategoryData[];
	}

	let { categories = [] }: Props = $props();

	let activeView = $state<'spine' | 'catalog'>('spine');
</script>

<section id="kategori" class="border-t border-ink/10 py-14 sm:py-20">
	<div class="mx-auto max-w-300 px-4 sm:px-6 lg:px-8">
		<!-- Section Header -->
		<div
			class="mb-10 flex flex-col justify-between gap-4 border-b border-ink/15 pb-4 md:flex-row md:items-end"
		>
			<div>
				<div
					class="mb-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-[0.12em] text-brick uppercase"
				>
					<Library size={14} />
					<span>Klasifikasi & Bidang Keilmuan</span>
				</div>
				<h2 class="font-serif text-2xl font-bold tracking-tight text-ink sm:text-4xl">
					Jelajahi Berdasarkan Disiplin Ilmu
				</h2>
				<p class="mt-1.5 max-w-xl font-sans text-sm text-ink-muted sm:text-base">
					Bukan susunan ikon generik. Telusuri buku selayaknya deretan punggung buku di rak
					perpustakaan kampus sesuai standar klasifikasi DDC.
				</p>
			</div>

			<!-- View Switcher -->
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1 rounded-md border border-ink/15 bg-sand/40 p-1">
					<button
						type="button"
						onclick={() => (activeView = 'spine')}
						class="focus-library rounded-sm px-2.5 py-1 text-xs font-medium transition-colors {activeView ===
						'spine'
							? 'bg-brick text-cream shadow-xs'
							: 'text-ink-muted hover:text-ink'}"
					>
						Punggung Buku
					</button>
					<button
						type="button"
						onclick={() => (activeView = 'catalog')}
						class="focus-library rounded-sm px-2.5 py-1 text-xs font-medium transition-colors {activeView ===
						'catalog'
							? 'bg-brick text-cream shadow-xs'
							: 'text-ink-muted hover:text-ink'}"
					>
						Kartu Indeks
					</button>
				</div>

				<a
					href="/rak"
					class="focus-library ml-2 hidden items-center gap-1 text-xs font-semibold text-brick hover:text-brick-dark sm:inline-flex"
				>
					<span>Buka Rak Lengkap</span>
					<ArrowRight size={13} />
				</a>
			</div>
		</div>

		<!-- Display 1: Vertical Book Spines (Anti-slop, realistic book spine shelf) -->
		{#if activeView === 'spine'}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
				{#each categories as category (category.code)}
					<CategoryChip
						name={category.name}
						code={category.code}
						count={category.count}
						color={category.color}
						variant="spine"
						href="/rak/{category.code}"
					/>
				{/each}
			</div>
		{:else}
			<!-- Display 2: Catalog Index Cards -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each categories as category (category.code)}
					<CategoryChip
						name={category.name}
						code={category.code}
						count={category.count}
						variant="catalog"
						href="/rak/{category.code}"
						class="w-full justify-between"
					/>
				{/each}
			</div>
		{/if}
	</div>
</section>
