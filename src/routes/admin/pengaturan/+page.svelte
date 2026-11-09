<script lang="ts">
	import {
		ArrowLeft,
		HardDrive,
		Shield,
		Save,
		CheckCircle2,
		AlertCircle,
		Clock,
		MapPin,
		Phone,
		Mail,
		FolderTree,
		Cloud,
		RefreshCw
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let isSubmitting = $state(false);
	let toastMessage = $state<string | null>(null);

	// Storage Driver State
	// svelte-ignore state_referenced_locally
	let storageDriver = $state<'local' | 'custom_local' | 's3_minio'>(
		data.settings.storageDriver ?? 'local'
	);
	// svelte-ignore state_referenced_locally
	let customStoragePath = $state(data.settings.customStoragePath ?? '');
	let isTestingPath = $state(false);
	let testResult = $state<{ success: boolean; message: string } | null>(null);

	$effect(() => {
		if (form?.success) {
			toastMessage = form.message || 'Pengaturan berhasil disimpan.';
			const timer = setTimeout(() => (toastMessage = null), 4000);
			return () => clearTimeout(timer);
		}
	});

	async function handleTestStoragePath() {
		if (!customStoragePath.trim()) {
			testResult = {
				success: false,
				message: 'Mohon masukkan jalur folder penyimpanan terlebih dahulu.'
			};
			return;
		}

		isTestingPath = true;
		testResult = null;
		try {
			const res = await fetch('/api/admin/test-storage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ path: customStoragePath.trim() })
			});
			const json = await res.json();
			testResult = {
				success: json.success,
				message: json.message
			};
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			testResult = {
				success: false,
				message: `Koneksi gagal: ${msg}`
			};
		} finally {
			isTestingPath = false;
		}
	}
</script>

<svelte:head>
	<title>Pengaturan Perpustakaan — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="max-w-4xl space-y-6">
	<!-- Toast Feedback -->
	{#if toastMessage}
		<div
			class="animate-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-md border border-sand/40 bg-ink px-4 py-3 text-xs font-medium text-cream shadow-xl duration-200 sm:text-sm"
		>
			<CheckCircle2 size={16} class="shrink-0 text-brick" />
			<span>{toastMessage}</span>
		</div>
	{/if}

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
					Konfigurasi penyimpanan terproteksi, profil institusi, dan parameter server lokal
				</p>
			</div>
		</div>

		<span
			class="flex items-center gap-1.5 rounded-sm border border-emerald-600/30 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-800"
		>
			<CheckCircle2 size={13} class="text-emerald-700" />
			<span>Tersimpan & Terintegrasi</span>
		</span>
	</div>

	{#if form?.error}
		<div
			class="flex items-center gap-2 rounded-md border border-brick/30 bg-brick/10 p-3 text-xs text-brick sm:text-sm"
		>
			<AlertCircle size={16} class="shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				await update();
			};
		}}
		class="space-y-6"
	>
		<!-- Storage quota & Driver Configuration -->
		<div class="catalog-card space-y-5 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
			<div class="flex items-center justify-between border-b border-ink/10 pb-3">
				<div class="flex items-center gap-2">
					<HardDrive size={18} class="text-brick" />
					<div>
						<h3 class="font-serif text-base font-bold text-ink">
							Tempat Penyimpanan Naskah & Kuota Server
						</h3>
						<p class="text-xs text-ink-muted">
							Pilih lokasi fisik tempat penyimpanan berkas digital (PDF, EPUB, Sampul) pada server
							lokal perpustakaan
						</p>
					</div>
				</div>
				<span
					class="hidden rounded-xs bg-brick/10 px-2 py-0.5 font-mono text-[10px] font-bold text-brick sm:inline-block"
				>
					On-Premise Ready
				</span>
			</div>

			<!-- Storage Driver Selection -->
			<div class="space-y-3">
				<span class="block text-xs font-bold text-ink uppercase sm:text-sm">
					Penyedia Media Driver (Lokasi Berkas)
				</span>

				<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
					<!-- Option 1: Default App Directory -->
					<label
						class="flex cursor-pointer flex-col justify-between rounded-lg border p-3.5 transition-all {storageDriver ===
						'local'
							? 'border-brick bg-cream shadow-xs ring-1 ring-brick'
							: 'border-ink/15 bg-sand/40 hover:bg-sand/60'}"
					>
						<div class="flex items-start gap-2.5">
							<input
								type="radio"
								name="storageDriver"
								value="local"
								bind:group={storageDriver}
								class="mt-0.5 text-brick focus:ring-brick"
							/>
							<div>
								<div class="flex items-center gap-1.5 font-semibold text-ink">
									<FolderTree size={15} class="text-brick" />
									<span class="text-xs sm:text-sm">Folder Bawaan Aplikasi</span>
								</div>
								<p class="mt-1 font-mono text-[11px] leading-tight text-ink-muted">
									storage/books/ & storage/covers/
								</p>
								<p class="mt-1 text-[11px] leading-tight text-ink/70">
									Tersimpan di dalam direktori kerja ElibUMKO. Cocok untuk instalasi cepat.
								</p>
							</div>
						</div>
					</label>

					<!-- Option 2: Custom Local Path (Partition / External HDD) -->
					<label
						class="flex cursor-pointer flex-col justify-between rounded-lg border p-3.5 transition-all {storageDriver ===
						'custom_local'
							? 'border-brick bg-cream shadow-xs ring-1 ring-brick'
							: 'border-ink/15 bg-sand/40 hover:bg-sand/60'}"
					>
						<div class="flex items-start gap-2.5">
							<input
								type="radio"
								name="storageDriver"
								value="custom_local"
								bind:group={storageDriver}
								class="mt-0.5 text-brick focus:ring-brick"
							/>
							<div>
								<div class="flex items-center gap-1.5 font-semibold text-ink">
									<HardDrive size={15} class="text-brick" />
									<span class="text-xs sm:text-sm">Partisi / Drive Khusus</span>
								</div>
								<p class="mt-1 font-mono text-[11px] leading-tight text-ink-muted">
									D:\ atau /mnt/storage/
								</p>
								<p class="mt-1 text-[11px] leading-tight text-ink/70">
									Disimpan di partisi HDD sekunder atau harddisk eksternal komputer perpustakaan.
								</p>
							</div>
						</div>
					</label>

					<!-- Option 3: MinIO / S3 Object Storage -->
					<label
						class="flex cursor-pointer flex-col justify-between rounded-lg border p-3.5 transition-all {storageDriver ===
						's3_minio'
							? 'border-brick bg-cream shadow-xs ring-1 ring-brick'
							: 'border-ink/15 bg-sand/40 hover:bg-sand/60'}"
					>
						<div class="flex items-start gap-2.5">
							<input
								type="radio"
								name="storageDriver"
								value="s3_minio"
								bind:group={storageDriver}
								class="mt-0.5 text-brick focus:ring-brick"
							/>
							<div>
								<div class="flex items-center gap-1.5 font-semibold text-ink">
									<Cloud size={15} class="text-brick" />
									<span class="text-xs sm:text-sm">MinIO / S3 Storage</span>
								</div>
								<p class="mt-1 font-mono text-[11px] leading-tight text-ink-muted">
									NAS Lokal / S3 Server
								</p>
								<p class="mt-1 text-[11px] leading-tight text-ink/70">
									Terhubung ke NAS kampus Synology/QNAP MinIO atau cloud storage.
								</p>
							</div>
						</div>
					</label>
				</div>
			</div>

			<!-- Dynamic Storage Path Input for custom_local -->
			{#if storageDriver === 'custom_local'}
				<div class="space-y-3 rounded-md border border-ink/15 bg-cream p-4">
					<div class="flex items-center justify-between gap-2">
						<label
							for="custom-storage-path"
							class="block text-xs font-semibold text-ink sm:text-sm"
						>
							Jalur Folder Penyimpanan Server (Full Path / Partisi)
						</label>
						<span class="font-mono text-[11px] text-ink-muted">
							Contoh: /mnt/data/perpustakaan atau D:/DataElib
						</span>
					</div>

					<div class="flex flex-col gap-2 sm:flex-row">
						<input
							id="custom-storage-path"
							name="customStoragePath"
							type="text"
							bind:value={customStoragePath}
							placeholder="Masukkan path direktori (misal: /data/elibumko atau D:/PerpustakaanData)"
							class="flex-1 rounded-sm border border-ink/20 bg-sand/20 px-3 py-2 font-mono text-xs text-ink focus:border-brick focus:bg-cream focus:outline-hidden sm:text-sm"
						/>
						<button
							type="button"
							disabled={isTestingPath || !customStoragePath.trim()}
							onclick={handleTestStoragePath}
							class="focus-library flex items-center justify-center gap-1.5 rounded-sm border border-ink/20 bg-sand/60 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand disabled:opacity-50"
						>
							{#if isTestingPath}
								<RefreshCw size={13} class="animate-spin text-brick" />
								<span>Memeriksa...</span>
							{:else}
								<CheckCircle2 size={13} class="text-brick" />
								<span>Uji Akses Direktori</span>
							{/if}
						</button>
					</div>

					{#if testResult}
						<div
							class="flex items-start gap-2 rounded-sm p-2.5 text-xs {testResult.success
								? 'border border-emerald-600/30 bg-emerald-50 text-emerald-800'
								: 'border border-brick/30 bg-brick/10 text-brick'}"
						>
							{#if testResult.success}
								<CheckCircle2 size={15} class="mt-0.5 shrink-0 text-emerald-700" />
							{:else}
								<AlertCircle size={15} class="mt-0.5 shrink-0 text-brick" />
							{/if}
							<span>{testResult.message}</span>
						</div>
					{/if}

					<p class="text-[11px] leading-relaxed text-ink-muted">
						<strong>Praktik Terbaik On-Premise:</strong> Menempatkan folder penyimpanan di partisi terpisah
						mencegah drive sistem (SSD OS) kehabisan ruang saat koleksi bertambah banyak. Berkas lama
						tetap dapat dibaca melalui mekanisme fallback terintegrasi.
					</p>
				</div>
			{/if}

			<!-- Dynamic S3 / MinIO Configuration -->
			{#if storageDriver === 's3_minio'}
				<div
					class="grid grid-cols-1 gap-4 rounded-md border border-ink/15 bg-cream p-4 sm:grid-cols-2"
				>
					<div>
						<label for="s3-endpoint" class="mb-1 block text-xs font-semibold text-ink sm:text-sm">
							Endpoint MinIO / S3
						</label>
						<input
							id="s3-endpoint"
							name="s3Endpoint"
							type="text"
							value={data.settings.s3Endpoint ?? ''}
							placeholder="http://192.168.1.100:9000 atau https://s3.amazonaws.com"
							class="w-full rounded-sm border border-ink/15 bg-sand/20 px-3 py-2 font-mono text-xs text-ink focus:border-brick focus:bg-cream focus:outline-hidden"
						/>
					</div>
					<div>
						<label for="s3-bucket" class="mb-1 block text-xs font-semibold text-ink sm:text-sm">
							Nama Bucket
						</label>
						<input
							id="s3-bucket"
							name="s3Bucket"
							type="text"
							value={data.settings.s3Bucket ?? ''}
							placeholder="elibumko-storage"
							class="w-full rounded-sm border border-ink/15 bg-sand/20 px-3 py-2 font-mono text-xs text-ink focus:border-brick focus:bg-cream focus:outline-hidden"
						/>
					</div>
				</div>
			{/if}

			<!-- Storage Quota Inputs -->
			<div
				class="grid grid-cols-1 gap-4 border-t border-ink/10 pt-4 text-xs sm:grid-cols-2 sm:text-sm"
			>
				<div>
					<label for="storage-limit" class="mb-1 block font-semibold text-ink">
						Batas Kuota Penyimpanan (GB)
					</label>
					<input
						id="storage-limit"
						name="storageLimitGB"
						type="number"
						min="10"
						max="5000"
						value={data.settings.storageLimitGB}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-mono text-ink focus:border-brick focus:outline-hidden"
					/>
					<p class="mt-1 text-[11px] text-ink-muted">
						Sesuaikan dengan kapasitas sisa partisi atau harddisk komputer perpustakaan Anda.
					</p>
				</div>
				<div>
					<label for="storage-used" class="mb-1 block font-semibold text-ink">
						Kapasitas Terpakai Saat Ini
					</label>
					<input
						id="storage-used"
						type="text"
						readonly
						value="{data.stats.storageUsedGB} GB ({data.stats.storagePercent}%)"
						class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 font-mono text-ink"
					/>
					<p class="mt-1 text-[11px] text-ink-muted">
						Total volume berkas naskah PDF, EPUB, dan sampul digital terdaftar.
					</p>
				</div>
			</div>
		</div>

		<!-- Institution identity -->
		<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
			<div class="flex items-center gap-2 border-b border-ink/10 pb-2">
				<Shield size={18} class="text-brick" />
				<h3 class="font-serif text-base font-bold text-ink">Identitas Perpustakaan Digital</h3>
			</div>

			<div class="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 sm:text-sm">
				<div>
					<label for="lib-name" class="mb-1 block font-semibold text-ink">
						Nama Perpustakaan <span class="text-brick">*</span>
					</label>
					<input
						id="lib-name"
						name="name"
						type="text"
						required
						value={data.settings.name}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
				<div>
					<label for="lib-inst" class="mb-1 block font-semibold text-ink">
						Institusi Naungan <span class="text-brick">*</span>
					</label>
					<input
						id="lib-inst"
						name="institution"
						type="text"
						required
						value={data.settings.institution}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
				<div class="sm:col-span-2">
					<label for="lib-title" class="mb-1 block font-semibold text-ink">
						Nama Unit / UPT Pelaksana
					</label>
					<input
						id="lib-title"
						name="title"
						type="text"
						value={data.settings.title}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
				<div>
					<label for="lib-email" class="mb-1 block font-semibold text-ink">
						<Mail size={13} class="mr-1 inline text-brick" />
						Email Layanan
					</label>
					<input
						id="lib-email"
						name="email"
						type="email"
						value={data.settings.email}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
				<div>
					<label for="lib-phone" class="mb-1 block font-semibold text-ink">
						<Phone size={13} class="mr-1 inline text-brick" />
						Telepon Layanan
					</label>
					<input
						id="lib-phone"
						name="phone"
						type="text"
						value={data.settings.phone}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
				<div class="sm:col-span-2">
					<label for="lib-address" class="mb-1 block font-semibold text-ink">
						<MapPin size={13} class="mr-1 inline text-brick" />
						Alamat Fisik Kampus
					</label>
					<input
						id="lib-address"
						name="address"
						type="text"
						value={data.settings.address}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
			</div>
		</div>

		<!-- Operational hours -->
		<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
			<div class="flex items-center gap-2 border-b border-ink/10 pb-2">
				<Clock size={18} class="text-brick" />
				<h3 class="font-serif text-base font-bold text-ink">Jadwal & Jam Operasional</h3>
			</div>

			<div class="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 sm:text-sm">
				<div>
					<label for="hours-weekday" class="mb-1 block font-semibold text-ink">
						Jam Layanan Hari Kerja (Senin – Jumat)
					</label>
					<input
						id="hours-weekday"
						name="hoursWeekday"
						type="text"
						value={data.settings.hoursWeekday}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
				<div>
					<label for="hours-saturday" class="mb-1 block font-semibold text-ink">
						Jam Layanan Akhir Pekan (Sabtu)
					</label>
					<input
						id="hours-saturday"
						name="hoursSaturday"
						type="text"
						value={data.settings.hoursSaturday}
						class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
					/>
				</div>
			</div>
		</div>

		<!-- Save Button -->
		<div class="flex justify-end pt-2">
			<button
				type="submit"
				disabled={isSubmitting}
				class="focus-library flex items-center gap-2 rounded-md bg-brick px-5 py-2.5 text-sm font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 disabled:opacity-50"
			>
				<Save size={16} />
				<span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
			</button>
		</div>
	</form>
</div>
