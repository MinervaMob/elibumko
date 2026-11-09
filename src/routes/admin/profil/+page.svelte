<script lang="ts">
	import {
		ArrowLeft,
		User,
		ShieldCheck,
		KeyRound,
		Save,
		CheckCircle2,
		AlertCircle,
		BadgeCheck,
		History,
		Server,
		Lock
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let isUpdatingProfile = $state(false);
	let isChangingPassword = $state(false);
	let toastMessage = $state<string | null>(null);

	const librarian = $derived(
		form?.librarian ??
			data?.librarian ?? {
				id: 'pustakawan-umko',
				name: 'Ilham Pangestu, S.Kom',
				email: 'pustakawan@umko.ac.id',
				role: 'Pustakawan Utama',
				nidn: '',
				phone: '',
				bio: '',
				avatar: null,
				lastLogin: 'Baru saja'
			}
	);

	const userInitials = $derived.by(() => {
		const clean = (librarian.name || 'Pustakawan')
			.replace(/^(Drs\.|Dr\.|Prof\.|H\.|Hj\.)\s+/gi, '')
			.trim();
		const words = clean.split(/\s+/).filter(Boolean);
		if (words.length >= 2) {
			return `${words[0][0]}${words[1][0]}`.toUpperCase();
		}
		return clean.slice(0, 2).toUpperCase() || 'PU';
	});

	$effect(() => {
		if (form?.profileSuccess) {
			toastMessage = form.profileMessage || 'Profil berhasil diperbarui.';
			const timer = setTimeout(() => (toastMessage = null), 4000);
			return () => clearTimeout(timer);
		}
		if (form?.passwordSuccess) {
			toastMessage = form.passwordMessage || 'Kata sandi berhasil diperbarui.';
			const timer = setTimeout(() => (toastMessage = null), 4000);
			return () => clearTimeout(timer);
		}
	});
</script>

<svelte:head>
	<title>Profil Pustakawan & Keamanan Akun — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="max-w-5xl space-y-6">
	<!-- Toast Feedback -->
	{#if toastMessage}
		<div
			class="animate-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-md border border-sand/40 bg-ink px-4 py-3 text-xs font-medium text-cream shadow-xl duration-200 sm:text-sm"
		>
			<CheckCircle2 size={16} class="shrink-0 text-brick" />
			<span>{toastMessage}</span>
		</div>
	{/if}

	<!-- Header -->
	<div
		class="flex flex-col items-start justify-between gap-4 border-b border-ink/15 pb-4 sm:flex-row sm:items-center"
	>
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
					Profil Pustakawan & Keamanan Akun
				</h2>
				<p class="mt-0.5 text-xs text-ink-muted">
					Kelola identitas pustakawan, kredensial akses, dan catatan audit sesi server lokal
				</p>
			</div>
		</div>

		<span
			class="flex items-center gap-1.5 rounded-sm border border-emerald-600/30 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-800"
		>
			<BadgeCheck size={14} class="text-emerald-700" />
			<span>Sesi Pustakawan Terverifikasi</span>
		</span>
	</div>

	<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
		<!-- Left Column: Forms (7 cols) -->
		<div class="space-y-6 lg:col-span-7">
			<!-- Personal Info Form -->
			<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<div class="flex items-center gap-2 border-b border-ink/10 pb-2">
					<User size={18} class="text-brick" />
					<h3 class="font-serif text-base font-bold text-ink">
						Informasi Pribadi & Penugasan Pustakawan
					</h3>
				</div>

				{#if form?.profileError}
					<div
						class="flex items-center gap-2 rounded-md border border-brick/30 bg-brick/10 p-3 text-xs text-brick"
					>
						<AlertCircle size={15} class="shrink-0" />
						<span>{form.profileError}</span>
					</div>
				{/if}

				<form
					method="POST"
					action="?/updateProfile"
					use:enhance={() => {
						isUpdatingProfile = true;
						return async ({ update }) => {
							isUpdatingProfile = false;
							await update({ reset: false });
						};
					}}
					class="space-y-4 text-xs sm:text-sm"
				>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="prof-name" class="mb-1 block font-semibold text-ink">
								Nama Lengkap & Gelar Akademik <span class="text-brick">*</span>
							</label>
							<input
								id="prof-name"
								name="name"
								type="text"
								required
								value={librarian.name}
								class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
							/>
						</div>

						<div>
							<label for="prof-email" class="mb-1 block font-semibold text-ink">
								Email Institusi <span class="text-brick">*</span>
							</label>
							<div class="relative">
								<input
									id="prof-email"
									name="email"
									type="email"
									required
									value={librarian.email}
									class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
								/>
							</div>
						</div>

						<div>
							<label for="prof-nidn" class="mb-1 block font-semibold text-ink">
								NIDN / NIP / ID Pegawai
							</label>
							<input
								id="prof-nidn"
								name="nidn"
								type="text"
								value={librarian.nidn ?? ''}
								class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-mono text-ink focus:border-brick focus:outline-hidden"
							/>
						</div>

						<div>
							<label for="prof-role" class="mb-1 block font-semibold text-ink">
								Peran / Jabatan
							</label>
							<input
								id="prof-role"
								name="role"
								type="text"
								value={librarian.role}
								class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
							/>
						</div>

						<div>
							<label for="prof-phone" class="mb-1 block font-semibold text-ink">
								Nomor Kontak / WhatsApp
							</label>
							<input
								id="prof-phone"
								name="phone"
								type="text"
								value={librarian.phone ?? ''}
								class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans text-ink focus:border-brick focus:outline-hidden"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="prof-bio" class="mb-1 block font-semibold text-ink">
								Tanggung Jawab & Deskripsi Tugas
							</label>
							<textarea
								id="prof-bio"
								name="bio"
								rows={3}
								class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-sans leading-relaxed text-ink focus:border-brick focus:outline-hidden"
								>{librarian.bio ?? ''}</textarea
							>
						</div>
					</div>

					<div class="flex justify-end pt-2">
						<button
							type="submit"
							disabled={isUpdatingProfile}
							class="focus-library flex items-center gap-2 rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 disabled:opacity-50 sm:text-sm"
						>
							<Save size={15} />
							<span>{isUpdatingProfile ? 'Menyimpan...' : 'Simpan Profil Pustakawan'}</span>
						</button>
					</div>
				</form>
			</div>

			<!-- Change Password Form -->
			<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<div class="flex items-center gap-2 border-b border-ink/10 pb-2">
					<KeyRound size={18} class="text-brick" />
					<h3 class="font-serif text-base font-bold text-ink">Perbarui Kata Sandi Akun</h3>
				</div>

				{#if form?.passwordError}
					<div
						class="flex items-center gap-2 rounded-md border border-brick/30 bg-brick/10 p-3 text-xs text-brick"
					>
						<AlertCircle size={15} class="shrink-0" />
						<span>{form.passwordError}</span>
					</div>
				{/if}

				<form
					method="POST"
					action="?/changePassword"
					use:enhance={() => {
						isChangingPassword = true;
						return async ({ update }) => {
							isChangingPassword = false;
							await update();
						};
					}}
					class="space-y-4 text-xs sm:text-sm"
				>
					<div>
						<label for="current-pwd" class="mb-1 block font-semibold text-ink">
							Kata Sandi Saat Ini <span class="text-brick">*</span>
						</label>
						<input
							id="current-pwd"
							name="currentPassword"
							type="password"
							required
							placeholder="Masukkan kata sandi lama Anda"
							class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-mono text-ink focus:border-brick focus:outline-hidden"
						/>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="new-pwd" class="mb-1 block font-semibold text-ink">
								Kata Sandi Baru <span class="text-brick">*</span>
							</label>
							<input
								id="new-pwd"
								name="newPassword"
								type="password"
								required
								minlength={6}
								placeholder="Minimal 6 karakter"
								class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-mono text-ink focus:border-brick focus:outline-hidden"
							/>
						</div>

						<div>
							<label for="confirm-pwd" class="mb-1 block font-semibold text-ink">
								Konfirmasi Kata Sandi Baru <span class="text-brick">*</span>
							</label>
							<input
								id="confirm-pwd"
								name="confirmPassword"
								type="password"
								required
								minlength={6}
								placeholder="Ulangi kata sandi baru"
								class="w-full rounded-sm border border-ink/15 bg-cream px-3 py-2 font-mono text-ink focus:border-brick focus:outline-hidden"
							/>
						</div>
					</div>

					<div class="flex justify-end pt-2">
						<button
							type="submit"
							disabled={isChangingPassword}
							class="focus-library flex items-center gap-2 rounded-md border border-ink/20 bg-sand/60 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand disabled:opacity-50 sm:text-sm"
						>
							<Lock size={15} class="text-brick" />
							<span>{isChangingPassword ? 'Memproses...' : 'Ubah Kata Sandi'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Right Column: Profile Summary & Security Status (5 cols) -->
		<div class="space-y-6 lg:col-span-5">
			<!-- Pustakawan Badge Card -->
			<div class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-6 text-center">
				<div
					class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brick font-serif text-2xl font-bold text-cream shadow-md ring-4 ring-sand"
				>
					{userInitials}
				</div>

				<h3 class="mt-4 font-serif text-lg font-bold text-ink">
					{librarian.name}
				</h3>

				<div class="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
					<ShieldCheck size={14} class="text-brick" />
					<span>{librarian.role}</span>
				</div>

				<p class="mt-3 text-xs leading-relaxed text-ink/80 italic">
					"{librarian.bio ||
						'Melayani pengelolaan repositori literatur digital sivitas akademika UMKO.'}"
				</p>

				<div
					class="mt-5 grid grid-cols-2 gap-2 border-t border-ink/10 pt-4 text-left font-mono text-xs"
				>
					<div class="rounded-sm bg-sand/50 p-2">
						<span class="block text-[10px] text-ink-muted uppercase">NIDN / NIP</span>
						<span class="font-bold text-ink">{librarian.nidn || '-'}</span>
					</div>
					<div class="rounded-sm bg-sand/50 p-2">
						<span class="block text-[10px] text-ink-muted uppercase">Institusi</span>
						<span class="block truncate font-bold text-ink">UMKO</span>
					</div>
				</div>
			</div>

			<!-- Server & Security Status -->
			<div class="catalog-card space-y-3 rounded-lg border border-ink/15 bg-sand/30 p-5">
				<div class="flex items-center gap-2 border-b border-ink/10 pb-2">
					<Server size={16} class="text-brick" />
					<h4 class="font-serif text-sm font-bold text-ink">
						Status Server & Lingkungan On-Premise
					</h4>
				</div>

				<div class="space-y-2 text-xs text-ink/80">
					<div class="flex items-center justify-between border-b border-ink/5 pb-1.5">
						<span class="text-ink-muted">Mode Instalasi:</span>
						<span class="font-mono font-semibold text-ink">Server Lokal Perpustakaan</span>
					</div>
					<div class="flex items-center justify-between border-b border-ink/5 pb-1.5">
						<span class="text-ink-muted">Enkripsi Sesi:</span>
						<span class="font-mono font-semibold text-emerald-800">HttpOnly Session Cookie</span>
					</div>
					<div class="flex items-center justify-between border-b border-ink/5 pb-1.5">
						<span class="text-ink-muted">Akses Terakhir:</span>
						<span class="font-mono text-ink">{librarian.lastLogin || 'Sesi Aktif Saat Ini'}</span>
					</div>
				</div>
			</div>

			<!-- Recent Activity Feed for this librarian -->
			<div class="catalog-card space-y-3 rounded-lg border border-ink/15 bg-sand/30 p-5">
				<div class="flex items-center justify-between border-b border-ink/10 pb-2">
					<div class="flex items-center gap-2">
						<History size={16} class="text-brick" />
						<h4 class="font-serif text-sm font-bold text-ink">Aktivitas Terakhir Akun Ini</h4>
					</div>
					<a href="/admin/aktivitas" class="text-[11px] font-semibold text-brick hover:underline">
						Semua Log &rarr;
					</a>
				</div>

				<div class="space-y-3">
					{#if (data?.activities || []).length === 0}
						<p class="py-2 text-center text-xs text-ink-muted">
							Belum ada riwayat aktivitas terbaru.
						</p>
					{:else}
						{#each (data?.activities || []).slice(0, 4) as act (act.id)}
							<div class="border-b border-ink/5 pb-2 last:border-0 last:pb-0">
								<div class="flex items-center justify-between text-[11px]">
									<span class="truncate pr-2 font-semibold text-ink">{act.description}</span>
									<span class="shrink-0 font-mono text-[10px] text-ink-muted">{act.timestamp}</span>
								</div>
								{#if act.targetTitle}
									<p class="mt-0.5 truncate font-serif text-[10px] text-brick">{act.targetTitle}</p>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
