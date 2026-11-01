<script lang="ts">
	import { AlertTriangle, Trash2 } from 'lucide-svelte';
	import type { BookData } from '#lib/types';

	interface Props {
		isOpen: boolean;
		book: BookData | null;
		onClose: () => void;
		onDeleted: (slug: string) => void;
	}

	let { isOpen, book, onClose, onDeleted }: Props = $props();

	let isDeleting = $state(false);
	let errorMessage = $state<string | null>(null);

	async function handleDelete() {
		if (!book) return;
		isDeleting = true;
		errorMessage = null;

		try {
			const res = await fetch(`/api/admin/books/${book.slug}`, {
				method: 'DELETE'
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'Gagal menghapus buku.');
			}
			onDeleted(book.slug);
			onClose();
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if isOpen && book}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-title"
	>
		<div
			class="animate-in fade-in zoom-in-95 w-full max-w-md space-y-4 rounded-lg border border-ink/20 bg-cream p-6 text-ink shadow-[0_16px_48px_rgba(42,26,22,0.25)] duration-150"
		>
			<div class="flex items-start gap-3">
				<div class="shrink-0 rounded-full bg-brick/15 p-2.5 text-brick">
					<AlertTriangle size={22} />
				</div>
				<div class="flex-1">
					<h3 id="delete-title" class="font-serif text-lg font-bold text-ink">
						Hapus Buku dari Katalog?
					</h3>
					<p class="mt-1 text-xs leading-relaxed text-ink-muted">
						Anda akan menghapus judul naskah berikut dari sirkulasi aktif:
					</p>
					<div class="mt-2.5 rounded-sm border border-ink/15 bg-sand/40 p-3">
						<p class="line-clamp-1 font-serif text-sm font-bold text-ink">{book.title}</p>
						<p class="mt-0.5 text-xs text-ink-muted">
							{book.author} ({book.year || 'Tahun tidak terdata'})
						</p>
					</div>
					<p class="mt-2 text-[11px] text-ink-muted">
						<em>Catatan:</em> Sistem menerapkan <strong>soft-delete</strong>. Naskah dapat
						dipulihkan kembali oleh Super Admin jika diperlukan.
					</p>
				</div>
			</div>

			{#if errorMessage}
				<div
					class="rounded-sm border border-brick/30 bg-brick/15 p-2.5 text-xs font-semibold text-brick"
				>
					{errorMessage}
				</div>
			{/if}

			<div class="flex items-center justify-end gap-2.5 border-t border-ink/15 pt-3">
				<button
					type="button"
					onclick={onClose}
					disabled={isDeleting}
					class="focus-library rounded-md border border-ink/20 px-4 py-2 text-xs text-ink transition-colors hover:bg-sand/60 sm:text-sm"
				>
					Batal
				</button>
				<button
					type="submit"
					onclick={handleDelete}
					disabled={isDeleting}
					class="focus-library flex items-center gap-1.5 rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 disabled:opacity-50 sm:text-sm"
				>
					<Trash2 size={15} />
					<span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Buku'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
