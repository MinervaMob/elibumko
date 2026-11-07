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
		Mail
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

	$effect(() => {
		if (form?.success) {
			toastMessage = form.message || 'Pengaturan berhasil disimpan.';
			const timer = setTimeout(() => (toastMessage = null), 4000);
			return () => clearTimeout(timer);
		}
	});
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
					Konfigurasi penyimpanan terproteksi, profil institusi, dan parameter layanan
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
						<label for="storage-limit" class="mb-1 block font-semibold text-ink">
							Batas Kuota Penyimpanan (GB)
						</label>
						<input
							id="storage-limit"
							name="storageLimitGB"
							type="number"
							min="10"
							max="1000"
							value={data.settings.storageLimitGB}
							class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-mono text-ink focus:border-brick focus:outline-hidden"
						/>
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
					</div>
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
