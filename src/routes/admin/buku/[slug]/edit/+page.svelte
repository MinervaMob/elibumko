<script lang="ts">
	/**
	 * /admin/buku/[slug]/edit — Halaman Sunting Metadata & Naskah Buku
	 *
	 * Fitur:
	 * - Sunting metadata bibliografi komprehensif
	 * - Penggantian & verifikasi berkas naskah terproteksi (PDF/EPUB/DOCX)
	 * - Pemilihan sampul: Lembar Pertama Dokumen, Grafis Kustom, atau Tipografi Resmi
	 * - Live BookCover preview interaktif
	 * - Pengelolaan klasifikasi DDC, Call Number, dan Kategori Rak
	 * - Manajemen struktur bab daftar isi (Table of Contents)
	 */

	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { TableOfContentItem } from '#lib/types';
	import BookCover from '#lib/components/book/BookCover.svelte';
	import {
		ArrowLeft,
		UploadCloud,
		FileText,
		CheckCircle2,
		AlertCircle,
		Sparkles,
		Plus,
		Trash2,
		BookOpen,
		RefreshCw,
		Image as ImageIcon,
		Check,
		ExternalLink,
		Eye
	} from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Snapshot book to initialize editable state
	// svelte-ignore state_referenced_locally
	const originalBook = data.book;

	// Form State
	let title = $state(originalBook.title || '');
	let author = $state(originalBook.author || '');
	let publisher = $state(originalBook.publisher || '');
	let year = $state<number | undefined>(
		typeof originalBook.year === 'number'
			? originalBook.year
			: originalBook.year
				? parseInt(String(originalBook.year), 10)
				: undefined
	);
	let edition = $state(originalBook.edition || '');
	let isbn = $state(originalBook.isbn || '');
	let pages = $state<number | undefined>(originalBook.pages ?? undefined);
	let language = $state(originalBook.language || 'Bahasa Indonesia');
	let classification = $state(originalBook.classification || '');
	let ddcCode = $state(originalBook.ddcCode || '');
	let ddcName = $state(originalBook.ddcName || '');
	let category = $state(originalBook.category || '');
	let tagInput = $state('');
	let tags = $state<string[]>([...(originalBook.tags || [])]);
	let synopsis = $state(originalBook.synopsis || '');
	let isFeatured = $state(originalBook.isFeatured ?? false);
	let fileType = $state<'pdf' | 'epub' | 'docx'>(originalBook.fileType || 'pdf');
	let coverUrl = $state<string | null>(originalBook.coverUrl || null);
	let uploadedFilePath = $state<string | undefined>(originalBook.filePath || undefined);
	let uploadedFileSize = $state<number | undefined>(originalBook.fileSize || undefined);

	// Determine initial cover source
	let coverSource = $state<'page1' | 'typography' | 'custom'>(
		originalBook.coverUrl
			? originalBook.coverUrl.includes('page1')
				? 'page1'
				: 'custom'
			: 'typography'
	);
	let extractedPageCoverUrl = $state<string | null>(
		originalBook.coverUrl && originalBook.coverUrl.includes('page1') ? originalBook.coverUrl : null
	);
	let customCoverUrl = $state<string | null>(
		originalBook.coverUrl && !originalBook.coverUrl.includes('page1') ? originalBook.coverUrl : null
	);

	// TOC State
	let tocItems = $state<TableOfContentItem[]>([...(originalBook.toc || [])]);

	// Upload & Extraction State
	let selectedFile = $state<File | null>(null);
	let isDragging = $state(false);
	let uploadProgress = $state(0);
	let isProcessing = $state(false);
	let extractionSuccess = $state(false);
	let autoFilledFields = $state<string[]>([]);
	let extractionLogs = $state<string[]>([]);
	let errorMessage = $state<string | null>(null);
	let isSubmitting = $state(false);
	let isUploadingCover = $state(false);
	let toastMessage = $state<string | null>(null);

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => (toastMessage = null), 4000);
	}

	// Completeness Calculator
	const completenessScore = $derived.by(() => {
		let score = 0;
		if (uploadedFilePath || selectedFile) score += 25;
		if (title.trim()) score += 20;
		if (author.trim()) score += 15;
		if (pages && pages > 0) score += 10;
		if (isbn.trim()) score += 10;
		if (synopsis.trim()) score += 10;
		if (coverSource === 'page1' && coverUrl) score += 10;
		else if (coverSource === 'custom' && coverUrl) score += 10;
		else if (coverSource === 'typography') score += 10;
		return Math.min(100, score);
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) processManuscriptFile(file);
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) processManuscriptFile(file);
	}

	async function processManuscriptFile(file: File) {
		const ext = file.name.split('.').pop()?.toLowerCase();
		if (!['pdf', 'docx', 'epub'].includes(ext || '')) {
			errorMessage =
				'Format berkas tidak didukung. Harap unggah PDF (.pdf), Word (.docx), atau EPUB (.epub).';
			return;
		}

		selectedFile = file;
		fileType = ext as 'pdf' | 'epub' | 'docx';
		errorMessage = null;
		isProcessing = true;
		uploadProgress = 15;
		autoFilledFields = [];
		extractionLogs = [];

		const formData = new FormData();
		formData.append('file', file);

		const progressTimer = setInterval(() => {
			if (uploadProgress < 85) {
				uploadProgress += Math.floor(Math.random() * 15) + 5;
			}
		}, 200);

		try {
			const res = await fetch('/api/admin/books/extract', {
				method: 'POST',
				body: formData
			});

			clearInterval(progressTimer);
			uploadProgress = 100;

			const result = await res.json();
			if (!res.ok) {
				throw new Error(result.message || 'Gagal memproses berkas naskah.');
			}

			if (result.saved) {
				uploadedFilePath = result.saved.filePath;
				uploadedFileSize = result.saved.size;
			}

			if (result.metadata) {
				const meta = result.metadata;
				const filled: string[] = [];

				if (meta.title && meta.title.trim()) {
					title = meta.title.trim();
					filled.push('Judul Naskah');
				}
				if (meta.author && meta.author.trim()) {
					author = meta.author.trim();
					filled.push('Penulis');
				}
				if (meta.pages && meta.pages > 0) {
					pages = Number(meta.pages);
					filled.push('Jumlah Halaman');
				}
				if (meta.isbn && meta.isbn.trim()) {
					isbn = meta.isbn.trim();
					filled.push('Nomor ISBN');
				}
				if (meta.coverUrl) {
					extractedPageCoverUrl = meta.coverUrl;
					coverSource = 'page1';
					coverUrl = meta.coverUrl;
					filled.push('Sampul Lembar Pertama');
				}
				if (Array.isArray(meta.toc) && meta.toc.length > 0) {
					tocItems = meta.toc;
					filled.push('Daftar Isi (' + meta.toc.length + ' bab)');
				}

				autoFilledFields = filled;
				extractionLogs = meta.summaryLog || [];
				extractionSuccess = true;
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Terjadi gangguan koneksi unggah.';
			errorMessage = msg;
			uploadProgress = 0;
		} finally {
			clearInterval(progressTimer);
			isProcessing = false;
		}
	}

	function handleCoverSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) uploadCoverImage(file);
	}

	async function uploadCoverImage(file: File) {
		isUploadingCover = true;
		errorMessage = null;

		try {
			const fd = new FormData();
			fd.append('file', file);
			fd.append('type', 'cover');

			const res = await fetch('/api/admin/upload', {
				method: 'POST',
				body: fd
			});

			const resData = await res.json();
			if (!res.ok) {
				throw new Error(resData.message || 'Gagal mengunggah berkas sampul.');
			}

			customCoverUrl = resData.coverUrl || resData.url;
			coverSource = 'custom';
			coverUrl = customCoverUrl;
			showToast('Sampul grafis kustom berhasil diperbarui.');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Gagal mengunggah sampul';
			errorMessage = message;
		} finally {
			isUploadingCover = false;
		}
	}

	function selectCoverSource(source: 'page1' | 'typography' | 'custom') {
		coverSource = source;
		if (source === 'page1') {
			coverUrl = extractedPageCoverUrl || originalBook.coverUrl || null;
		} else if (source === 'custom') {
			coverUrl = customCoverUrl;
		} else {
			coverUrl = null;
		}
	}

	function onDdcCodeChange(code: string) {
		ddcCode = code;
		const found = data.ddcTree.find((d) => d.code === code);
		if (found) {
			ddcName = found.name;
			const mapping: Record<string, { cat: string; call: string }> = {
				'000': { cat: 'Komputer & Sains Data', call: '005.1' },
				'100': { cat: 'Filsafat & Etika', call: '170' },
				'200': { cat: 'Kemuhammadiyahan & Islam', call: '297.6' },
				'300': { cat: 'Ilmu Sosial & Hukum', call: '340' },
				'400': { cat: 'Bahasa & Budaya Lampung', call: '899.221' },
				'500': { cat: 'Sains & Matematika', call: '510' },
				'600': { cat: 'Manajemen & Ekonomi Syariah', call: '658' }
			};

			if (mapping[code]) {
				category = mapping[code].cat;
				classification = mapping[code].call;
			} else {
				classification = code;
			}
		}
	}

	function onCategoryChange(selectedCategoryName: string) {
		category = selectedCategoryName;
		const mapping: Record<string, { ddc: string; call: string }> = {
			'Komputer & Sains Data': { ddc: '000', call: '005.1' },
			'Filsafat & Etika': { ddc: '100', call: '170' },
			'Kemuhammadiyahan & Islam': { ddc: '200', call: '297.6' },
			'Ilmu Sosial & Hukum': { ddc: '300', call: '340' },
			'Pendidikan & Pedagogi': { ddc: '300', call: '370.7' },
			'Bahasa & Budaya Lampung': { ddc: '400', call: '899.221' },
			'Sains & Matematika': { ddc: '500', call: '510' },
			'Manajemen & Ekonomi Syariah': { ddc: '600', call: '658' }
		};

		if (mapping[selectedCategoryName]) {
			ddcCode = mapping[selectedCategoryName].ddc;
			const found = data.ddcTree.find((d) => d.code === ddcCode);
			if (found) ddcName = found.name;
			classification = mapping[selectedCategoryName].call;
		}
	}

	function addTag() {
		const clean = tagInput.trim().replace(/^#/, '');
		if (clean && !tags.includes(clean)) {
			tags = [...tags, clean];
			tagInput = '';
		}
	}

	function removeTag(tagToRemove: string) {
		tags = tags.filter((t) => t !== tagToRemove);
	}

	function addTocItem() {
		const nextChapterNumber = tocItems.length + 1;
		tocItems = [
			...tocItems,
			{
				title: `Bab ${nextChapterNumber}: Bagian Baru`,
				page: (tocItems[tocItems.length - 1]?.page || 1) + 15
			}
		];
	}

	function removeTocItem(index: number) {
		tocItems = tocItems.filter((_, i) => i !== index);
	}

	async function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		if (!title.trim()) {
			errorMessage = 'Judul naskah wajib diisi.';
			window.scrollTo({ top: 300, behavior: 'smooth' });
			return;
		}
		if (!author.trim()) {
			errorMessage = 'Nama penulis / pengarang wajib diisi.';
			window.scrollTo({ top: 300, behavior: 'smooth' });
			return;
		}

		isSubmitting = true;
		errorMessage = null;

		const payload = {
			title: title.trim(),
			author: author.trim(),
			publisher: publisher.trim(),
			year,
			edition: edition.trim(),
			isbn: isbn.trim(),
			pages,
			language,
			classification,
			ddcCode,
			ddcName,
			category,
			tags,
			synopsis: synopsis.trim(),
			toc: tocItems,
			isFeatured,
			fileType,
			coverUrl,
			filePath: uploadedFilePath,
			fileSize: uploadedFileSize
		};

		try {
			const res = await fetch(`/api/admin/books/${originalBook.slug}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const resData = await res.json();
			if (!res.ok) {
				throw new Error(resData.message || 'Gagal menyimpan perubahan naskah.');
			}

			goto(`/admin/buku?updated=${encodeURIComponent(title.trim())}`);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Terjadi gangguan saat menyimpan.';
			errorMessage = msg;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} finally {
			isSubmitting = false;
		}
	}

	function formatBytes(bytes?: number): string {
		if (!bytes) return '-';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}
</script>

<svelte:head>
	<title>Sunting: {originalBook.title} — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="space-y-6 pb-16">
	<!-- Toast Notification -->
	{#if toastMessage}
		<div
			class="animate-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-md border border-sand/40 bg-ink px-4 py-3 text-xs font-medium text-cream shadow-xl duration-200 sm:text-sm"
		>
			<CheckCircle2 size={16} class="shrink-0 text-brick" />
			<span>{toastMessage}</span>
		</div>
	{/if}

	<!-- Top Breadcrumbs & Page Header -->
	<div
		class="flex flex-col gap-4 border-b border-ink/15 pb-4 md:flex-row md:items-center md:justify-between"
	>
		<div class="flex items-center gap-3">
			<a
				href="/admin/buku"
				class="focus-library rounded-sm border border-ink/15 p-2 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
				title="Kembali ke Manajemen Buku"
			>
				<ArrowLeft size={16} />
			</a>
			<div>
				<div class="flex items-center gap-2 text-xs text-ink-muted">
					<a href="/admin/buku" class="hover:underline">Manajemen Buku</a>
					<span>/</span>
					<span class="max-w-[200px] truncate font-mono text-brick">{originalBook.slug}</span>
					<span>/</span>
					<span class="font-semibold text-ink">Sunting Metadata</span>
				</div>
				<h1 class="mt-0.5 font-serif text-xl font-bold text-ink sm:text-2xl">
					Sunting Metadata Naskah Buku
				</h1>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/buku/{originalBook.slug}"
				target="_blank"
				class="focus-library flex items-center gap-1.5 rounded-md border border-ink/20 bg-sand/30 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/60"
				title="Lihat halaman detail katalog publik"
			>
				<ExternalLink size={14} class="text-brick" />
				<span>Lihat di Publik</span>
			</a>
			<a
				href="/baca/{originalBook.slug}"
				target="_blank"
				class="focus-library flex items-center gap-1.5 rounded-md border border-ink/20 bg-sand/30 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/60"
				title="Buka naskah di reader pembaca"
			>
				<Eye size={14} class="text-brick" />
				<span>Buka di Reader</span>
			</a>
		</div>
	</div>

	<!-- Error Alert Box -->
	{#if errorMessage}
		<div
			class="animate-in fade-in flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-4 text-xs text-red-900"
		>
			<AlertCircle size={18} class="mt-0.5 shrink-0 text-red-600" />
			<div class="flex-1">
				<p class="font-semibold">Perhatian:</p>
				<p class="mt-0.5 leading-relaxed">{errorMessage}</p>
			</div>
			<button
				type="button"
				onclick={() => (errorMessage = null)}
				class="font-bold text-red-700 hover:text-red-900"
			>
				✕
			</button>
		</div>
	{/if}

	<!-- Extraction Success Banner -->
	{#if extractionSuccess && autoFilledFields.length > 0}
		<div
			class="animate-in fade-in flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-950"
		>
			<Sparkles size={18} class="mt-0.5 shrink-0 text-emerald-600" />
			<div class="flex-1">
				<p class="font-semibold text-emerald-900">Berkas Naskah Baru Berhasil Diproses!</p>
				<p class="mt-0.5 text-emerald-800">
					Sistem telah menyelaraskan field metadata: <strong>{autoFilledFields.join(', ')}</strong>.
				</p>
			</div>
			<button
				type="button"
				onclick={() => (extractionSuccess = false)}
				class="text-emerald-700 hover:text-emerald-900"
			>
				✕
			</button>
		</div>
	{/if}

	<!-- 2-Column Main Layout: Form (Left) & Sticky Preview (Right) -->
	<form onsubmit={handleSubmit} class="grid grid-cols-1 gap-6 lg:grid-cols-12">
		<!-- LEFT COLUMN: Form Inputs (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- 1. Berkas Naskah Digital -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6 {isDragging
					? 'ring-2 ring-brick ring-offset-2'
					: ''}"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<div class="flex items-center justify-between border-b border-ink/10 pb-3">
					<div class="flex items-center gap-2">
						<FileText size={18} class="text-brick" />
						<h2 class="font-serif text-base font-bold text-ink sm:text-lg">
							Berkas Naskah Digital Terproteksi
						</h2>
					</div>
					<span
						class="rounded bg-brick/10 px-2 py-0.5 font-mono text-xs font-bold text-brick uppercase"
					>
						{fileType}
					</span>
				</div>

				<!-- Existing File Info Pill -->
				<div
					class="flex items-center justify-between rounded-md border border-ink/15 bg-white p-3.5"
				>
					<div class="flex min-w-0 items-center gap-3">
						<div class="shrink-0 rounded bg-sand/50 p-2 text-brick">
							<FileText size={20} />
						</div>
						<div class="min-w-0">
							<p class="truncate font-mono text-xs font-bold text-ink">
								{selectedFile
									? selectedFile.name
									: originalBook.filePath?.split('/').pop() || 'Naskah Digital Aktif'}
							</p>
							<p class="mt-0.5 text-[11px] text-ink-muted">
								Format: <span class="font-semibold uppercase">{fileType}</span> · Ukuran: {formatBytes(
									uploadedFileSize || originalBook.fileSize || undefined
								)} · Status:
								<span class="font-semibold text-emerald-700"
									>Tersimpan di Penyimpanan Terproteksi</span
								>
							</p>
						</div>
					</div>
					<label
						for="replace-file-input"
						class="focus-library shrink-0 cursor-pointer rounded border border-ink/20 bg-sand/40 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/70"
					>
						Ganti Berkas
						<input
							id="replace-file-input"
							type="file"
							accept=".pdf,.docx,.epub,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip"
							onchange={handleFileSelect}
							class="sr-only"
						/>
					</label>
				</div>

				<!-- Dropzone if dragging or replacing -->
				{#if isDragging}
					<div
						class="rounded-lg border-2 border-dashed border-brick bg-brick/10 p-6 text-center text-xs font-semibold text-brick"
					>
						Lepaskan berkas di sini untuk mengganti naskah...
					</div>
				{/if}

				{#if isProcessing}
					<div class="space-y-2 rounded-md border border-ink/15 bg-white p-3 text-xs">
						<div class="flex items-center justify-between font-semibold text-ink">
							<span class="flex items-center gap-2">
								<RefreshCw size={14} class="animate-spin text-brick" />
								<span>Memproses dan mengekstraksi naskah...</span>
							</span>
							<span class="font-mono text-brick">{uploadProgress}%</span>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-sand/40">
							<div
								class="h-full bg-brick transition-all duration-300"
								style:width="{uploadProgress}%"
							></div>
						</div>
						{#if extractionLogs.length > 0}
							<div class="mt-2 space-y-1 font-mono text-[11px] text-ink-muted">
								{#each extractionLogs as log, i (i)}
									<p>• {log}</p>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- 2. Berkas Sampul Buku (Cover Image) -->
			<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<div class="flex items-center justify-between border-b border-ink/10 pb-3">
					<div class="flex items-center gap-2">
						<ImageIcon size={18} class="text-brick" />
						<h2 class="font-serif text-base font-bold text-ink sm:text-lg">
							Berkas Sampul Buku (Cover Image)
						</h2>
					</div>
					<span class="text-xs text-ink-muted">Maks. 10 MB (JPG, PNG, WebP, AVIF)</span>
				</div>

				<!-- Cover Mode Selector -->
				<div class="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
					<button
						type="button"
						onclick={() => selectCoverSource('page1')}
						class="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-all {coverSource ===
						'page1'
							? 'border-brick bg-brick/10 font-bold text-ink shadow-xs'
							: 'border-ink/15 bg-white text-ink-muted hover:border-ink/30 hover:text-ink'}"
					>
						<span class="flex items-center gap-1.5 text-xs font-semibold">
							{#if coverSource === 'page1'}<Check size={13} class="text-brick" />{/if}
							Lembar Pertama Dokumen
						</span>
						<span class="text-[11px] leading-tight font-normal text-ink-muted">
							Thumbnail otomatis dari halaman muka naskah.
						</span>
					</button>

					<button
						type="button"
						onclick={() => selectCoverSource('custom')}
						class="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-all {coverSource ===
						'custom'
							? 'border-brick bg-brick/10 font-bold text-ink shadow-xs'
							: 'border-ink/15 bg-white text-ink-muted hover:border-ink/30 hover:text-ink'}"
					>
						<span class="flex items-center gap-1.5 text-xs font-semibold">
							{#if coverSource === 'custom'}<Check size={13} class="text-brick" />{/if}
							Unggah Grafis Kustom
						</span>
						<span class="text-[11px] leading-tight font-normal text-ink-muted">
							Pilih foto/grafis dari perangkat komputer.
						</span>
					</button>

					<button
						type="button"
						onclick={() => selectCoverSource('typography')}
						class="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-all {coverSource ===
						'typography'
							? 'border-brick bg-brick/10 font-bold text-ink shadow-xs'
							: 'border-ink/15 bg-white text-ink-muted hover:border-ink/30 hover:text-ink'}"
					>
						<span class="flex items-center gap-1.5 text-xs font-semibold">
							{#if coverSource === 'typography'}<Check size={13} class="text-brick" />{/if}
							Tipografi Resmi UMKO
						</span>
						<span class="text-[11px] leading-tight font-normal text-ink-muted">
							Tata letak tipografi resmi otomatis.
						</span>
					</button>
				</div>

				<!-- Cover Upload Action if custom is selected -->
				{#if coverSource === 'custom'}
					<div class="space-y-2 rounded-md border border-ink/15 bg-white p-3.5">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-ink">Unggah Berkas Sampul Grafis:</span>
							<label
								for="cover-upload-input"
								class="focus-library flex cursor-pointer items-center gap-1.5 rounded border border-ink/20 bg-sand/40 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand/70"
							>
								{#if isUploadingCover}
									<RefreshCw size={13} class="animate-spin text-brick" />
									<span>Mengunggah...</span>
								{:else}
									<UploadCloud size={13} class="text-brick" />
									<span>Pilih Gambar Sampul</span>
								{/if}
								<input
									id="cover-upload-input"
									type="file"
									accept="image/jpeg,image/png,image/webp,image/avif"
									onchange={handleCoverSelected}
									class="sr-only"
								/>
							</label>
						</div>
						{#if coverUrl}
							<p class="truncate font-mono text-[11px] text-ink-muted">
								Tautan Sampul: {coverUrl}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- 3. Informasi Bibliografi Utama -->
			<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<div class="flex items-center gap-2 border-b border-ink/10 pb-3">
					<BookOpen size={18} class="text-brick" />
					<h2 class="font-serif text-base font-bold text-ink sm:text-lg">
						Informasi Bibliografi Utama
					</h2>
				</div>

				<div class="space-y-4 text-xs sm:text-sm">
					<div>
						<label for="book-title" class="mb-1 block text-xs font-semibold text-ink">
							Judul Lengkap Naskah *
						</label>
						<input
							id="book-title"
							type="text"
							required
							bind:value={title}
							placeholder="Contoh: Metodologi Penelitian Pendidikan Matematika dan Sains"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="book-author" class="mb-1 block text-xs font-semibold text-ink">
								Penulis / Pengarang *
							</label>
							<input
								id="book-author"
								type="text"
								required
								bind:value={author}
								placeholder="Nama lengkap beserta gelar akademik"
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
						</div>

						<div>
							<label for="book-publisher" class="mb-1 block text-xs font-semibold text-ink">
								Penerbit
							</label>
							<input
								id="book-publisher"
								type="text"
								bind:value={publisher}
								list="publishers-list"
								placeholder="Contoh: UMKO Press"
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
							<datalist id="publishers-list">
								{#each data.existingPublishers as pub (pub)}
									<option value={pub}></option>
								{/each}
							</datalist>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
						<div>
							<label for="book-year" class="mb-1 block text-xs font-semibold text-ink">
								Tahun Terbit
							</label>
							<input
								id="book-year"
								type="number"
								bind:value={year}
								placeholder="Contoh: 2026"
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
						</div>

						<div>
							<label for="book-isbn" class="mb-1 block text-xs font-semibold text-ink">
								Nomor ISBN
							</label>
							<input
								id="book-isbn"
								type="text"
								bind:value={isbn}
								placeholder="978-602-xxx-xxx-x"
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
						</div>

						<div>
							<label for="book-pages" class="mb-1 block text-xs font-semibold text-ink">
								Jumlah Halaman
							</label>
							<input
								id="book-pages"
								type="number"
								bind:value={pages}
								placeholder="Contoh: 342"
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
						</div>

						<div>
							<label for="book-edition" class="mb-1 block text-xs font-semibold text-ink">
								Edisi / Cetakan
							</label>
							<input
								id="book-edition"
								type="text"
								bind:value={edition}
								placeholder="Contoh: Edisi Pertama"
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label for="book-language" class="mb-1 block text-xs font-semibold text-ink">
							Bahasa Naskah
						</label>
						<select
							id="book-language"
							bind:value={language}
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						>
							<option value="Bahasa Indonesia">Bahasa Indonesia</option>
							<option value="Bahasa Inggris">Bahasa Inggris (English)</option>
							<option value="Bahasa Arab">Bahasa Arab (العربية)</option>
							<option value="Bahasa Lampung">Bahasa Lampung</option>
						</select>
					</div>
				</div>
			</div>

			<!-- 4. Klasifikasi Perpustakaan & Rak Digital -->
			<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<div class="flex items-center justify-between border-b border-ink/10 pb-3">
					<h2 class="font-serif text-base font-bold text-ink sm:text-lg">
						Klasifikasi Perpustakaan & Rak Digital
					</h2>
					<span class="text-xs text-ink-muted">Dewey Decimal Classification</span>
				</div>

				<div class="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 sm:text-sm">
					<div>
						<label for="book-ddc-select" class="mb-1 block text-xs font-semibold text-ink">
							Divisi Utama DDC
						</label>
						<select
							id="book-ddc-select"
							value={ddcCode}
							onchange={(e) => onDdcCodeChange(e.currentTarget.value)}
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						>
							<option value="">Pilih Divisi DDC...</option>
							{#each data.ddcTree as node (node.code)}
								<option value={node.code}>
									{node.code} — {node.name}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="book-call-number" class="mb-1 block text-xs font-semibold text-ink">
							Nomor Klasifikasi Presisi (Call Number)
						</label>
						<input
							id="book-call-number"
							type="text"
							bind:value={classification}
							placeholder="Contoh: 370 atau 899.221"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div class="sm:col-span-2">
						<label for="book-category-select" class="mb-1 block text-xs font-semibold text-ink">
							Kategori Rak Digital
						</label>
						<select
							id="book-category-select"
							value={category}
							onchange={(e) => onCategoryChange(e.currentTarget.value)}
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						>
							<option value="">Pilih Kategori Rak...</option>
							{#each data.categories as cat (cat.code)}
								<option value={cat.name}>
									{cat.name} ({cat.code})
								</option>
							{/each}
						</select>
					</div>

					<!-- Tags / Kata Kunci -->
					<div class="sm:col-span-2">
						<label for="tag-input" class="mb-1 block text-xs font-semibold text-ink">
							Kata Kunci & Label (Tags)
						</label>
						<div class="flex gap-2">
							<input
								id="tag-input"
								type="text"
								bind:value={tagInput}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addTag();
									}
								}}
								placeholder="Ketik label lalu tekan Enter..."
								class="flex-1 rounded-sm border border-ink/20 bg-white px-3 py-2 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
							<button
								type="button"
								onclick={addTag}
								class="focus-library rounded border border-ink/20 bg-sand px-3 py-2 text-xs font-semibold text-ink hover:bg-sand-dark/30"
							>
								Tambah
							</button>
						</div>

						{#if tags.length > 0}
							<div class="mt-2.5 flex flex-wrap gap-1.5">
								{#each tags as tag (tag)}
									<span
										class="inline-flex items-center gap-1 rounded border border-ink/10 bg-sand/60 px-2 py-0.5 text-xs text-ink"
									>
										<span>#{tag}</span>
										<button
											type="button"
											onclick={() => removeTag(tag)}
											class="ml-1 text-ink-muted hover:text-red-700"
											title="Hapus label"
										>
											✕
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- 5. Sinopsis / Abstrak Naskah -->
			<div class="catalog-card space-y-3 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<div class="flex items-center justify-between border-b border-ink/10 pb-3">
					<h2 class="font-serif text-base font-bold text-ink sm:text-lg">
						Sinopsis / Abstrak Naskah
					</h2>
					<span class="text-xs text-ink-muted">{synopsis.length} karakter</span>
				</div>

				<textarea
					id="book-synopsis"
					rows={4}
					bind:value={synopsis}
					placeholder="Tuliskan ringkasan isi buku, ruang lingkup kajian, atau tujuan pembelajaran buku ajar ini..."
					class="w-full rounded-sm border border-ink/20 bg-white p-3 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
				></textarea>
			</div>

			<!-- 6. Struktur Daftar Isi (Table of Contents) -->
			<div class="catalog-card space-y-4 rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<div class="flex items-center justify-between border-b border-ink/10 pb-3">
					<div>
						<h2 class="font-serif text-base font-bold text-ink sm:text-lg">
							Struktur Daftar Isi Naskah (TOC)
						</h2>
						<p class="mt-0.5 text-xs text-ink-muted">Navigasi bab pembaca digital terproteksi</p>
					</div>
					<button
						type="button"
						onclick={addTocItem}
						class="focus-library flex items-center gap-1.5 rounded border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-brick hover:bg-sand/40"
					>
						<Plus size={13} />
						<span>Tambah Bab</span>
					</button>
				</div>

				{#if tocItems.length > 0}
					<div class="space-y-2">
						{#each tocItems as item, idx (idx)}
							<div
								class="flex items-center gap-2 rounded-md border border-ink/10 bg-white p-2 text-xs"
							>
								<span class="w-6 shrink-0 text-center font-mono text-ink-muted">
									{idx + 1}.
								</span>
								<input
									type="text"
									bind:value={item.title}
									placeholder="Judul Bab / Bagian"
									class="flex-1 rounded-sm border border-ink/15 px-2.5 py-1 text-ink focus:border-brick focus:outline-none"
								/>
								<div class="flex shrink-0 items-center gap-1">
									<span class="text-[11px] text-ink-muted">Hlm.</span>
									<input
										type="number"
										bind:value={item.page}
										placeholder="1"
										class="w-16 rounded-sm border border-ink/15 px-2 py-1 text-center font-mono text-ink focus:border-brick focus:outline-none"
									/>
								</div>
								<button
									type="button"
									onclick={() => removeTocItem(idx)}
									class="rounded p-1 text-ink-muted hover:bg-red-50 hover:text-red-700"
									title="Hapus bab ini"
								>
									<Trash2 size={13} />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="rounded-md border border-dashed border-ink/20 p-4 text-center text-xs text-ink-muted"
					>
						Belum ada daftar isi terdaftar. Klik "+ Tambah Bab" untuk menyusun struktur navigasi
						naskah.
					</div>
				{/if}
			</div>

			<!-- 7. Opsi Publikasi -->
			<div class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5 sm:p-6">
				<label class="flex cursor-pointer items-start gap-3">
					<input
						type="checkbox"
						bind:checked={isFeatured}
						class="mt-1 h-4 w-4 rounded border-ink/30 text-brick focus:ring-brick"
					/>
					<div>
						<span class="font-serif text-sm font-bold text-ink">
							Jadikan Naskah Pilihan / Koleksi Unggulan (Featured Ebook)
						</span>
						<p class="mt-0.5 text-xs text-ink-muted">
							Buku akan diprioritaskan tampil pada karusel halaman muka perpustakaan digital UMKO.
						</p>
					</div>
				</label>
			</div>
		</div>

		<!-- RIGHT COLUMN: Sticky Cover Preview & Actions (4 cols) -->
		<div class="space-y-6 lg:col-span-4">
			<div class="sticky top-6 space-y-6">
				<!-- Live Book Cover Visualizer Card -->
				<div
					class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)]"
				>
					<div class="mb-4 border-b border-ink/10 pb-3">
						<h3 class="font-serif text-sm font-bold text-ink">Pratinjau Sampul Naskah</h3>
						<p class="text-[11px] text-ink-muted">Tampilan resmi di rak & katalog pembaca</p>
					</div>

					<div class="flex justify-center py-2">
						<div class="w-48 shadow-xl transition-all">
							<BookCover
								title={title || originalBook.title}
								author={author || originalBook.author}
								src={coverUrl}
								classification={classification || originalBook.classification || '370'}
								{isFeatured}
								size="lg"
							/>
						</div>
					</div>

					<div class="mt-4 space-y-1 border-t border-ink/10 pt-3 text-[11px] text-ink-muted">
						<div class="flex justify-between">
							<span>Sumber Sampul:</span>
							<strong class="font-mono text-ink uppercase">{coverSource}</strong>
						</div>
						<div class="flex justify-between">
							<span>Penerbit:</span>
							<span class="max-w-[150px] truncate text-ink"
								>{publisher || originalBook.publisher || '-'}</span
							>
						</div>
						<div class="flex justify-between">
							<span>Total Pembaca:</span>
							<span class="font-mono font-bold text-ink"
								>{originalBook.readersCount || 0} pembaca</span
							>
						</div>
					</div>
				</div>

				<!-- Completeness Checklist Meter -->
				<div class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-semibold text-ink">Kelengkapan Metadata</span>
						<span class="font-mono text-xs font-bold text-brick">{completenessScore}%</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-sand/60">
						<div
							class="h-full bg-brick transition-all duration-300"
							style:width="{completenessScore}%"
						></div>
					</div>
					<p class="mt-2 text-[11px] text-ink-muted">
						Semakin lengkap metadata, semakin mudah naskah ditemukan oleh mahasiswa dan dosen dalam
						pencarian.
					</p>
				</div>

				<!-- Action Buttons -->
				<div class="space-y-2.5">
					<button
						type="submit"
						disabled={isSubmitting}
						class="focus-library flex w-full items-center justify-center gap-2 rounded-md bg-brick px-4 py-3 text-sm font-semibold text-cream shadow-sm transition-all hover:bg-brick/90 disabled:opacity-50"
					>
						{#if isSubmitting}
							<RefreshCw size={16} class="animate-spin" />
							<span>Menyimpan Perubahan...</span>
						{:else}
							<Check size={16} />
							<span>Simpan Perubahan Metadata</span>
						{/if}
					</button>

					<a
						href="/admin/buku"
						class="focus-library flex w-full items-center justify-center rounded-md border border-ink/20 bg-white px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/40"
					>
						Batal & Kembali ke Katalog
					</a>
				</div>
			</div>
		</div>
	</form>
</div>
