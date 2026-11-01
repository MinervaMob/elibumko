<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-svelte';
	import logoUmko from '#lib/assets/LOGO-UMKO.avif';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let rememberMe = $state(true);
	let isSubmitting = $state(false);

	const loopItems = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

	$effect(() => {
		if (form?.email) {
			email = form.email;
		}
	});
</script>

<svelte:head>
	<title>Masuk Portal Pustakawan | ElibUMKO Universitas Muhammadiyah Kotabumi</title>
</svelte:head>

<!-- Svelte 5 Snippets for High-Performance Looping Watermark Grid -->
{#snippet logoSet()}
	<div class="flex shrink-0 items-center">
		{#each loopItems as i (i)}
			<div class="shrink-0 pr-12 sm:pr-16">
				<img
					src={logoUmko}
					alt=""
					aria-hidden="true"
					class="pointer-events-none h-14 w-14 object-contain opacity-[0.06] select-none sm:h-16 sm:w-16"
					loading="eager"
					decoding="async"
				/>
			</div>
		{/each}
	</div>
{/snippet}

{#snippet logoRow(reverse: boolean, duration: string)}
	<div class="flex items-center overflow-hidden py-3 select-none">
		<div
			class="flex shrink-0 items-center {reverse ? 'animate-marquee-reverse' : 'animate-marquee'}"
			style="animation-duration: {duration};"
		>
			{@render logoSet()}
			{@render logoSet()}
		</div>
	</div>
{/snippet}

<div
	class="relative flex min-h-screen flex-col justify-between overflow-hidden bg-cream p-4 text-ink sm:p-6 lg:p-8"
>
	<!-- Animated Background: Lightweight GPU-Composited Looping Logo Grid -->
	<div
		class="pointer-events-none fixed inset-0 z-0 flex scale-110 -rotate-6 flex-col justify-around overflow-hidden select-none"
		aria-hidden="true"
	>
		{@render logoRow(false, '80s')}
		{@render logoRow(true, '95s')}
		{@render logoRow(false, '85s')}
		{@render logoRow(true, '90s')}
		{@render logoRow(false, '82s')}
		{@render logoRow(true, '98s')}
		{@render logoRow(false, '88s')}
	</div>

	<!-- Main Card Container -->
	<main class="relative z-10 mx-auto my-auto w-full max-w-md">
		<div
			class="space-y-6 rounded-xl border border-ink/15 bg-white/85 p-6 shadow-[0_20px_50px_rgba(42,26,22,0.12)] backdrop-blur-md sm:p-8"
		>
			<!-- University Header & Emblems -->
			<div class="space-y-2 text-center">
				<img
					src={logoUmko}
					alt="Logo Universitas Muhammadiyah Kotabumi"
					class="mx-auto mb-1 h-16 w-16 object-contain drop-shadow-sm"
				/>
				<div>
					<h1 class="font-serif text-2xl font-bold tracking-tight text-ink">Portal ElibUMKO</h1>
					<p
						class="mt-0.5 font-mono text-[11px] font-semibold tracking-wider text-terracotta uppercase"
					>
						Universitas Muhammadiyah Kotabumi
					</p>
				</div>
				<p class="mx-auto max-w-xs text-xs leading-relaxed text-ink-muted">
					Masuk untuk mengelola katalog pustaka, klasifikasi DDC, dan pemantauan aktivitas baca
					digital.
				</p>
			</div>

			<!-- Success Notification (e.g. after Logout) -->
			{#if data.loggedOut}
				<div
					class="animate-in fade-in flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 duration-200"
				>
					<CheckCircle2 size={16} class="mt-0.5 shrink-0 text-emerald-700" />
					<div>
						<p class="font-semibold">Sesi Berhasil Diakhiri</p>
						<p class="mt-0.5 text-[11px] text-emerald-800">
							Anda telah keluar dari portal pustakawan secara aman.
						</p>
					</div>
				</div>
			{/if}

			<!-- Error Notification -->
			{#if form?.message}
				<div
					class="animate-in fade-in flex items-start gap-2.5 rounded-md border border-brick/30 bg-brick/10 p-3.5 text-xs text-brick duration-200"
				>
					<AlertCircle size={16} class="mt-0.5 shrink-0 text-brick" />
					<div>
						<p class="font-semibold">Gagal Masuk</p>
						<p class="mt-0.5 text-[11px] leading-relaxed">{form.message}</p>
					</div>
				</div>
			{/if}

			<!-- Sign-in Form with Progressive Enhancement -->
			<form
				method="POST"
				action="?/signInEmail"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<!-- Email Input -->
				<div class="space-y-1.5 text-left">
					<label for="email" class="block text-xs font-semibold text-ink">
						Email Resmi Pustakawan
					</label>
					<div class="relative">
						<div
							class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted"
						>
							<Mail size={16} />
						</div>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							required
							autocomplete="username"
							placeholder="pustakawan@umko.ac.id"
							class="w-full rounded-md border border-ink/20 bg-white py-2.5 pr-3.5 pl-10 text-sm text-ink transition-all placeholder:text-ink-muted/50 focus:border-brick focus:ring-2 focus:ring-brick/20 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Password Input -->
				<div class="space-y-1.5 text-left">
					<label for="password" class="block text-xs font-semibold text-ink"> Kata Sandi </label>
					<div class="relative">
						<div
							class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-muted"
						>
							<Lock size={16} />
						</div>
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							autocomplete="current-password"
							placeholder="••••••••••••"
							class="w-full rounded-md border border-ink/20 bg-white py-2.5 pr-10 pl-10 text-sm text-ink transition-all placeholder:text-ink-muted/50 focus:border-brick focus:ring-2 focus:ring-brick/20 focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="focus-library absolute inset-y-0 right-0 flex items-center pr-3 text-ink-muted hover:text-ink"
							aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
						>
							{#if showPassword}
								<EyeOff size={16} />
							{:else}
								<Eye size={16} />
							{/if}
						</button>
					</div>
				</div>

				<!-- Remember Me & Help -->
				<div class="flex items-center justify-between pt-1 text-xs">
					<label class="flex cursor-pointer items-center gap-2 select-none">
						<input
							type="checkbox"
							name="rememberMe"
							bind:checked={rememberMe}
							class="h-4 w-4 cursor-pointer rounded-xs accent-brick"
						/>
						<span class="text-ink-muted hover:text-ink">Ingat saya</span>
					</label>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="focus-library mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-brick px-4 py-2.5 text-sm font-semibold text-cream shadow-xs transition-all hover:bg-brick-dark disabled:opacity-60"
				>
					{#if isSubmitting}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-cream"
						></div>
						<span>Memverifikasi Sesi...</span>
					{:else}
						<LogIn size={16} />
						<span>Masuk Portal Pustakawan</span>
					{/if}
				</button>
			</form>

			<!-- Security & Helpdesk Info -->
			<div class="border-t border-ink/10 pt-4 text-center">
				<p class="text-xs text-ink-muted">Akses terbatas untuk staf dan pustakawan resmi UMKO.</p>
				<p class="mt-1 text-[11px] text-ink-muted/80">
					Kendala autentikasi? Hubungi <span class="font-semibold text-brick"
						>UPT Perpustakaan & SIM UMKO</span
					>.
				</p>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer
		class="relative z-10 mx-auto w-full max-w-md space-y-2 pt-6 text-center text-[11px] text-ink-muted/80"
	>
		<div>
			<a
				href="/"
				class="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-brick"
			>
				&larr; <span>Kembali ke Katalog Perpustakaan</span>
			</a>
		</div>
		<p>
			&copy; {new Date().getFullYear()} Universitas Muhammadiyah Kotabumi &bull; Perpustakaan Digital
		</p>
		<p class="font-mono text-[10px]">Ditenagai oleh Better Auth & Drizzle ORM PostgreSQL</p>
	</footer>
</div>

<style>
	@keyframes marqueeTrack {
		0% {
			transform: translate3d(0, 0, 0);
		}
		100% {
			transform: translate3d(-50%, 0, 0);
		}
	}

	@keyframes marqueeTrackReverse {
		0% {
			transform: translate3d(-50%, 0, 0);
		}
		100% {
			transform: translate3d(0, 0, 0);
		}
	}

	.animate-marquee {
		animation: marqueeTrack linear infinite;
		will-change: transform;
	}

	.animate-marquee-reverse {
		animation: marqueeTrackReverse linear infinite;
		will-change: transform;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-marquee,
		.animate-marquee-reverse {
			animation-play-state: paused !important;
		}
	}
</style>
