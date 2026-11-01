<script lang="ts">
	import { ArrowLeft, HardDrive, Shield } from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Pengaturan Perpustakaan — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="max-w-4xl space-y-6">
	<div class="flex items-center justify-between gap-4 border-b border-ink/15 pb-4">
		<div class="flex items-center gap-3">
			<a
				href="/admin"
				class="focus-library rounded-sm border border-ink/15 p-2 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
				title="Kembali ke Ringkasan"
			>
				<ArrowLeft size={16} />
			</a>
			<div>
				<h2 class="font-serif text-xl font-bold text-ink sm:text-2xl">
					Pengaturan Sistem Perpustakaan
				</h2>
				<p class="mt-0.5 text-xs text-ink-muted">
					Konfigurasi penyimpanan terproteksi, batas kuota, dan preferensi institusi
				</p>
			</div>
		</div>

		<span
			class="rounded-sm border border-terracotta/30 bg-terracotta/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-terracotta"
		>
			Tahap CMS 2(e) Siap Dibangun
		</span>
	</div>

	<div class="space-y-6">
		<!-- Institution identity -->
		<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
			<div class="flex items-center gap-2 border-b border-ink/10 pb-2">
				<Shield size={18} class="text-brick" />
				<h3 class="font-serif text-base font-bold text-ink">Identitas Perpustakaan Digital</h3>
			</div>

			<div class="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 sm:text-sm">
				<div>
					<label for="lib-name" class="mb-1 block font-semibold text-ink">Nama Perpustakaan</label>
					<input
						id="lib-name"
						type="text"
						readonly
						value="ElibUMKO (Perpustakaan Digital UMKO)"
						class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-sans text-ink"
					/>
				</div>
				<div>
					<label for="lib-inst" class="mb-1 block font-semibold text-ink">Institusi Naungan</label>
					<input
						id="lib-inst"
						type="text"
						readonly
						value="Universitas Muhammadiyah Kotabumi"
						class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-sans text-ink"
					/>
				</div>
				<div>
					<label for="lib-email" class="mb-1 block font-semibold text-ink">Email Layanan</label>
					<input
						id="lib-email"
						type="email"
						readonly
						value="perpustakaan@umko.ac.id"
						class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-sans text-ink"
					/>
				</div>
				<div>
					<label for="lib-loc" class="mb-1 block font-semibold text-ink">Lokasi Kampus</label>
					<input
						id="lib-loc"
						type="text"
						readonly
						value="Kotabumi, Lampung Utara, Lampung"
						class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-sans text-ink"
					/>
				</div>
			</div>
		</div>

		<!-- Storage quota -->
		<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
			<div class="flex items-center gap-2 border-b border-ink/10 pb-2">
				<HardDrive size={18} class="text-brick" />
				<h3 class="font-serif text-base font-bold text-ink">
					Penyimpanan Terproteksi & Kuota Server
				</h3>
			</div>

			<div class="space-y-4 text-xs sm:text-sm">
				<div>
					<label for="storage-driver" class="mb-1 block font-semibold text-ink"
						>Penyedia Media Driver</label
					>
					<input
						id="storage-driver"
						type="text"
						readonly
						value="Local Protected Storage (storage/books/ & storage/covers/) — Abstraksi Siap S3/MinIO"
						class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-mono text-xs text-ink"
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="storage-limit" class="mb-1 block font-semibold text-ink"
							>Batas Kuota Penyimpanan (GB)</label
						>
						<input
							id="storage-limit"
							type="number"
							readonly
							value={data.stats.storageLimitGB}
							class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-mono text-ink"
						/>
					</div>
					<div>
						<label for="storage-used" class="mb-1 block font-semibold text-ink"
							>Kapasitas Terpakai Saat Ini</label
						>
						<input
							id="storage-used"
							type="text"
							readonly
							value="{data.stats.storageUsedGB} GB ({data.stats.storagePercent}%)"
							class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-mono text-ink"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
