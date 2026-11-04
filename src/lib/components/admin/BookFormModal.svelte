<script lang="ts">
	import {
		X,
		Upload,
		FileText,
		BookOpen,
		CheckCircle2,
		AlertCircle,
		Plus,
		Trash2,
		Sparkles,
		Image as ImageIcon
	} from 'lucide-svelte';
	import type { BookData, CategoryData, ClassificationNode, TableOfContentItem } from '#lib/types';

	interface Props {
		isOpen: boolean;
		bookToEdit?: BookData | null;
		ddcTree?: ClassificationNode[];
		categories?: CategoryData[];
		onClose: () => void;
		onSaved: (savedBook: BookData) => void;
	}

	let {
		isOpen,
		bookToEdit = null,
		ddcTree = [],
		categories = [],
		onClose,
		onSaved
	}: Props = $props();

	// Form State
	let title = $state('');
	let author = $state('');
	let publisher = $state('UMKO Press');
	let year = $state<number>(new Date().getFullYear());
	let edition = $state('Edisi Pertama');
	let isbn = $state('');
	let pages = $state<number | undefined>();
	let language = $state('Bahasa Indonesia');
	let classification = $state('370');
	let ddcCode = $state('300');
	let ddcName = $state('Ilmu Sosial & Pendidikan');
	let category = $state('Pendidikan');
	let tagInput = $state('');
	let tags = $state<string[]>([]);
	let synopsis = $state('');
	let isFeatured = $state(false);
	let fileType = $state<'pdf' | 'epub' | 'docx'>('pdf');
	let coverUrl = $state<string | null>(null);
	let isUploadingCover = $state(false);

	// TOC State
	let tocItems = $state<TableOfContentItem[]>([{ title: 'Bab I: Pendahuluan', page: 1 }]);

	// Upload State
	let selectedFile: File | null = $state(null);
	let uploadProgress = $state(0);
	let isUploading = $state(false);
	let uploadSuccess = $state(false);
	let uploadedFilePath = $state<string | undefined>();
	let uploadedFileSize = $state<number | undefined>();
	let errorMessage = $state<string | null>(null);
	let isSaving = $state(false);

	// Synchronize when bookToEdit changes
	$effect(() => {
		if (isOpen) {
			if (bookToEdit) {
				title = bookToEdit.title;
				author = bookToEdit.author;
				publisher = bookToEdit.publisher ?? 'UMKO Press';
				year = typeof bookToEdit.year === 'number' ? bookToEdit.year : new Date().getFullYear();
				edition = bookToEdit.edition ?? 'Edisi Pertama';
				isbn = bookToEdit.isbn ?? '';
				pages = bookToEdit.pages ?? undefined;
				language = bookToEdit.language ?? 'Bahasa Indonesia';
				classification = bookToEdit.classification ?? '000';
				ddcCode = bookToEdit.ddcCode ?? '000';
				ddcName = bookToEdit.ddcName ?? 'Karya Umum';
				category = bookToEdit.category ?? 'Umum';
				tags = bookToEdit.tags ? [...bookToEdit.tags] : [];
				synopsis = bookToEdit.synopsis ?? '';
				isFeatured = Boolean(bookToEdit.isFeatured);
				fileType = bookToEdit.fileType ?? 'pdf';
				coverUrl = bookToEdit.coverUrl ?? null;
				tocItems = bookToEdit.toc
					? JSON.parse(JSON.stringify(bookToEdit.toc))
					: [{ title: 'Bab I: Pendahuluan', page: 1 }];
				uploadedFilePath = bookToEdit.fileUrl ?? undefined;
				uploadSuccess = true;
			} else {
				// Reset form for fresh create
				title = '';
				author = '';
				publisher = 'UMKO Press';
				year = new Date().getFullYear();
				edition = 'Edisi Pertama';
				isbn = '';
				pages = undefined;
				language = 'Bahasa Indonesia';
				classification = '370';
				ddcCode = '300';
				ddcName = 'Ilmu Sosial & Pendidikan';
				category = 'Pendidikan';
				tags = ['Pendidikan', 'Akademik'];
				synopsis = '';
				isFeatured = false;
				fileType = 'pdf';
				coverUrl = null;
				tocItems = [{ title: 'Bab I: Pendahuluan', page: 1 }];
				selectedFile = null;
				uploadProgress = 0;
				isUploading = false;
				uploadSuccess = false;
				uploadedFilePath = undefined;
				uploadedFileSize = undefined;
				errorMessage = null;
			}
		}
	});

	function handleFileSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
		if (!['.pdf', '.epub'].includes(ext)) {
			errorMessage = 'Hanya berkas PDF (.pdf) dan EPUB (.epub) yang didukung.';
			return;
		}

		selectedFile = file;
		fileType = ext === '.epub' ? 'epub' : 'pdf';
		errorMessage = null;
		uploadFile(file);
	}

	function uploadFile(file: File) {
		isUploading = true;
		uploadProgress = 10;
		uploadSuccess = false;

		const formData = new FormData();
		formData.append('file', file);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/api/admin/upload');

		xhr.upload.onprogress = (ev) => {
			if (ev.lengthComputable) {
				uploadProgress = Math.min(95, Math.round((ev.loaded / ev.total) * 100));
			}
		};

		xhr.onload = () => {
			isUploading = false;
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					const res = JSON.parse(xhr.responseText);
					uploadProgress = 100;
					uploadSuccess = true;
					uploadedFilePath = res.filePath;
					uploadedFileSize = res.size;
				} catch {
					uploadProgress = 100;
					uploadSuccess = true;
				}
			} else {
				errorMessage = `Unggahan gagal (${xhr.status}). Silakan coba kembali.`;
				uploadProgress = 0;
			}
		};

		xhr.onerror = () => {
			isUploading = false;
			uploadProgress = 0;
			errorMessage = 'Koneksi terputus saat mengunggah berkas.';
		};

		xhr.send(formData);
	}

	function addTag() {
		const t = tagInput.trim();
		if (t && !tags.includes(t)) {
			tags = [...tags, t];
			tagInput = '';
		}
	}

	function removeTag(tagToRemove: string) {
		tags = tags.filter((t) => t !== tagToRemove);
	}

	function addTocRow() {
		tocItems = [
			...tocItems,
			{
				title: `Bab ${tocItems.length + 1}: `,
				page: (tocItems[tocItems.length - 1]?.page ?? 0) + 30
			}
		];
	}

	function removeTocRow(idx: number) {
		tocItems = tocItems.filter((_, i) => i !== idx);
	}

	function onDdcChange(code: string) {
		const found = ddcTree.find((d) => d.code === code);
		if (found) {
			ddcCode = found.code;
			ddcName = found.name;
			classification = found.code;
			const cat = categories.find((c) => c.code === code);
			if (cat) category = cat.name;
		}
	}

	async function handleCoverSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const file = input.files[0];
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

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'Gagal mengunggah berkas sampul.');
			}

			coverUrl = data.coverUrl || data.url;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Gagal mengunggah sampul';
			errorMessage = message;
		} finally {
			isUploadingCover = false;
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim()) {
			errorMessage = 'Judul buku wajib diisi.';
			return;
		}
		if (!author.trim()) {
			errorMessage = 'Nama penulis wajib diisi.';
			return;
		}

		isSaving = true;
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
			filePath: uploadedFilePath,
			fileSize: uploadedFileSize,
			coverUrl
		};

		try {
			let res;
			if (bookToEdit) {
				res = await fetch(`/api/admin/books/${bookToEdit.slug}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				res = await fetch('/api/admin/books', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'Gagal menyimpan naskah buku.');
			}

			onSaved(data.book);
			onClose();
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
		} finally {
			isSaving = false;
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-xs sm:p-6"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Modal Dialog -->
		<div
			class="animate-in fade-in zoom-in-95 my-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-ink/20 bg-cream text-ink shadow-[0_16px_48px_rgba(42,26,22,0.25)] duration-150"
		>
			<!-- Header -->
			<div
				class="flex shrink-0 items-center justify-between border-b border-ink/15 bg-sand/30 px-5 py-4"
			>
				<div class="flex items-center gap-2.5">
					<div class="rounded-sm bg-brick p-2 text-cream shadow-xs">
						<BookOpen size={18} />
					</div>
					<div>
						<h3 id="modal-title" class="font-serif text-lg leading-tight font-bold text-ink">
							{bookToEdit ? 'Sunting Metadata Naskah' : 'Unggah & Daftarkan Ebook Baru'}
						</h3>
						<p class="text-xs text-ink-muted">
							Sistem Penyimpanan Terproteksi Perpustakaan Digital UMKO
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="focus-library rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
					aria-label="Tutup form"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Body (Scrollable) -->
			<form onsubmit={handleSubmit} class="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
				{#if errorMessage}
					<div
						class="flex items-start gap-2 rounded-md border border-brick/30 bg-brick/15 p-3 text-xs text-brick"
					>
						<AlertCircle size={16} class="mt-0.5 shrink-0" />
						<div class="flex-1 font-medium">{errorMessage}</div>
					</div>
				{/if}

				<!-- 1. FILE UPLOAD SECTION WITH PROGRESS -->
				<div class="catalog-card space-y-3 rounded-md border border-ink/15 bg-sand/35 p-4">
					<div class="flex items-center justify-between">
						<label
							for="book-file"
							class="flex items-center gap-2 font-serif text-sm font-bold text-ink"
						>
							<Upload size={16} class="text-brick" />
							<span>Berkas Naskah Digital (PDF / EPUB)</span>
						</label>
						<span class="font-mono text-[11px] text-ink-muted">Maksimal 100 MB</span>
					</div>

					<div
						class="relative rounded-md border-2 border-dashed border-ink/20 bg-sand/20 p-4 text-center transition-colors hover:border-brick/50"
					>
						<input
							id="book-file"
							type="file"
							accept=".pdf,.epub"
							onchange={handleFileSelected}
							class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
							disabled={isUploading}
						/>

						{#if isUploading}
							<div class="space-y-2 py-2">
								<div class="flex items-center justify-between font-mono text-xs">
									<span class="font-semibold text-ink">Mengunggah ke Storage Terproteksi...</span>
									<span class="font-bold text-brick">{uploadProgress}%</span>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-sand">
									<div
										class="h-full bg-brick transition-all duration-200"
										style="width: {uploadProgress}%"
									></div>
								</div>
							</div>
						{:else if uploadSuccess || bookToEdit?.fileUrl}
							<div
								class="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-ink"
							>
								<CheckCircle2 size={16} class="text-brick" />
								<span>
									{selectedFile
										? selectedFile.name
										: bookToEdit?.title
											? `${bookToEdit.slug}.${fileType}`
											: 'Berkas tersimpan'}
								</span>
								<span class="font-mono text-[11px] text-ink-muted uppercase">({fileType})</span>
								<span class="ml-2 text-xs text-brick hover:underline">Ganti berkas</span>
							</div>
						{:else}
							<div class="space-y-1 py-2">
								<div class="flex items-center justify-center gap-2 text-sm font-semibold text-ink">
									<FileText size={18} class="text-brick" />
									<span>Pilih berkas PDF atau EPUB dari perangkat</span>
								</div>
								<p class="text-xs text-ink-muted">
									Naskah akan diamankan di folder storage terproteksi tanpa tautan unduh publik
								</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- 1b. COVER IMAGE UPLOAD SECTION -->
				<div class="catalog-card space-y-3 rounded-md border border-ink/15 bg-sand/35 p-4">
					<div class="flex items-center justify-between">
						<label
							for="book-cover-input"
							class="flex items-center gap-2 font-serif text-sm font-bold text-ink"
						>
							<ImageIcon size={16} class="text-brick" />
							<span>Berkas Sampul Buku (Cover Image)</span>
						</label>
						<span class="font-mono text-[11px] text-ink-muted"
							>JPG, PNG, WebP, AVIF &bull; Maks 10 MB</span
						>
					</div>

					{#if coverUrl}
						<div class="flex items-center gap-4 rounded-md border border-ink/15 bg-white/70 p-3">
							<div
								class="h-20 w-14 shrink-0 overflow-hidden rounded-xs border border-ink/20 shadow-xs"
							>
								<img src={coverUrl} alt="Pratinjau Sampul" class="h-full w-full object-cover" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-xs font-semibold text-ink">Sampul Kustom Terpasang</p>
								<p class="mt-0.5 truncate font-mono text-[11px] text-ink-muted">{coverUrl}</p>
								<div class="mt-2 flex items-center gap-3">
									<label class="cursor-pointer text-xs font-semibold text-brick hover:underline">
										Ganti Sampul
										<input
											type="file"
											accept=".jpg,.jpeg,.png,.webp,.avif"
											onchange={handleCoverSelected}
											class="hidden"
											disabled={isUploadingCover}
										/>
									</label>
									<button
										type="button"
										onclick={() => (coverUrl = null)}
										class="text-xs text-ink-muted transition-colors hover:text-brick"
									>
										Hapus (Gunakan Sampul Standar)
									</button>
								</div>
							</div>
						</div>
					{:else}
						<div
							class="relative rounded-md border-2 border-dashed border-ink/20 bg-sand/20 p-4 text-center transition-colors hover:border-brick/50"
						>
							<input
								id="book-cover-input"
								type="file"
								accept=".jpg,.jpeg,.png,.webp,.avif"
								onchange={handleCoverSelected}
								class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
								disabled={isUploadingCover}
							/>
							{#if isUploadingCover}
								<p class="animate-pulse py-2 font-mono text-xs font-semibold text-brick">
									Mengunggah gambar sampul ke media service...
								</p>
							{:else}
								<div class="space-y-1 py-1">
									<div
										class="flex items-center justify-center gap-2 text-xs font-semibold text-ink sm:text-sm"
									>
										<ImageIcon size={16} class="text-brick" />
										<span>Pilih foto/grafis sampul untuk naskah ini</span>
									</div>
									<p class="text-[11px] text-ink-muted">
										Opsional: Jika tidak diunggah, sistem otomatis menyajikan sampul tipografi resmi
										UMKO.
									</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- 2. PRIMARY METADATA -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="sm:col-span-2">
						<label for="book-title" class="mb-1 block text-xs font-semibold text-ink">
							Judul Lengkap Naskah <span class="text-brick">*</span>
						</label>
						<input
							id="book-title"
							type="text"
							required
							bind:value={title}
							placeholder="Contoh: Metodologi Penelitian Pendidikan Matematika dan Sains"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div>
						<label for="book-author" class="mb-1 block text-xs font-semibold text-ink">
							Penulis / Pengarang <span class="text-brick">*</span>
						</label>
						<input
							id="book-author"
							type="text"
							required
							bind:value={author}
							placeholder="Nama lengkap beserta gelar akademik"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
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
							placeholder="Contoh: UMKO Press / Rajawali Pers"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div>
						<label for="book-year" class="mb-1 block text-xs font-semibold text-ink">
							Tahun Terbit
						</label>
						<input
							id="book-year"
							type="number"
							bind:value={year}
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
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
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
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
							placeholder="342"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
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
							placeholder="Edisi Ke-2 Revisi"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>
				</div>

				<!-- 3. CLASSIFICATION & DDC SELECTION -->
				<div class="grid grid-cols-1 gap-4 border-t border-ink/10 pt-2 sm:grid-cols-2">
					<div>
						<label for="book-ddc" class="mb-1 block text-xs font-semibold text-ink">
							Divisi Klasifikasi DDC
						</label>
						<select
							id="book-ddc"
							value={ddcCode}
							onchange={(e) => onDdcChange((e.target as HTMLSelectElement).value)}
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						>
							{#each ddcTree as node (node.code)}
								<option value={node.code}>{node.code} — {node.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="book-class-exact" class="mb-1 block text-xs font-semibold text-ink">
							Nomor Klasifikasi Presisi (Call Number)
						</label>
						<input
							id="book-class-exact"
							type="text"
							bind:value={classification}
							placeholder="Contoh: 370.7 atau 297.6"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-sm text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>
				</div>

				<!-- 4. SYNOPSIS & TAGS -->
				<div class="space-y-3 border-t border-ink/10 pt-2">
					<div>
						<label for="book-synopsis" class="mb-1 block text-xs font-semibold text-ink">
							Sinopsis / Abstrak Buku
						</label>
						<textarea
							id="book-synopsis"
							rows="3"
							bind:value={synopsis}
							placeholder="Ringkasan isi buku, pokok bahasan, dan target pembaca..."
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-xs leading-relaxed text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="book-tags" class="mb-1 block text-xs font-semibold text-ink">
							Tag Subjek (Tekan Enter untuk menambah)
						</label>
						<div class="mb-2 flex items-center gap-2">
							<input
								id="book-tags"
								type="text"
								bind:value={tagInput}
								onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
								placeholder="Ketik tag subjek lalu tekan Enter..."
								class="flex-1 rounded-sm border border-ink/20 bg-white px-3 py-1.5 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
							<button
								type="button"
								onclick={addTag}
								class="focus-library rounded-sm border border-ink/15 bg-sand px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand/80"
							>
								Tambah
							</button>
						</div>

						<div class="flex flex-wrap gap-1.5">
							{#each tags as tag (tag)}
								<span
									class="inline-flex items-center gap-1 rounded-xs border border-ink/15 bg-sand/60 px-2 py-0.5 font-mono text-[11px] text-ink"
								>
									<span>#{tag}</span>
									<button
										type="button"
										onclick={() => removeTag(tag)}
										class="ml-0.5 hover:text-brick"
									>
										&times;
									</button>
								</span>
							{/each}
						</div>
					</div>
				</div>

				<!-- 5. TABLE OF CONTENTS BUILDER -->
				<div class="space-y-3 border-t border-ink/10 pt-2">
					<div class="flex items-center justify-between">
						<div>
							<h4 class="font-serif text-sm font-bold text-ink">Daftar Isi / Bab Dokumen</h4>
							<p class="text-[11px] text-ink-muted">
								Daftar ini akan otomatis muncul pada bilah navigasi reader pembaca
							</p>
						</div>
						<button
							type="button"
							onclick={addTocRow}
							class="focus-library flex items-center gap-1 rounded-sm border border-ink/20 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-sand/60"
						>
							<Plus size={13} />
							<span>Tambah Bab</span>
						</button>
					</div>

					<div class="max-h-48 space-y-2 overflow-y-auto pr-1">
						{#each tocItems as item, idx (idx)}
							<div class="flex items-center gap-2">
								<input
									type="text"
									bind:value={item.title}
									placeholder="Judul Bab / Bagian"
									class="flex-1 rounded-sm border border-ink/20 bg-white px-2.5 py-1 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
								/>
								<div class="flex shrink-0 items-center gap-1 font-mono text-xs text-ink-muted">
									<span>hlm.</span>
									<input
										type="number"
										min="1"
										bind:value={item.page}
										class="w-16 rounded-sm border border-ink/20 bg-white px-2 py-1 font-mono text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
									/>
								</div>
								<button
									type="button"
									onclick={() => removeTocRow(idx)}
									class="rounded p-1 text-ink-muted transition-colors hover:bg-sand/40 hover:text-brick"
									title="Hapus baris bab"
								>
									<Trash2 size={14} />
								</button>
							</div>
						{/each}
					</div>
				</div>

				<!-- 6. FEATURED BADGE TOGGLE -->
				<div class="flex items-center justify-between border-t border-ink/10 pt-2">
					<div class="flex items-center gap-2">
						<Sparkles size={16} class="text-brick" />
						<div>
							<p class="text-xs font-semibold text-ink">Tampilkan di "Pilihan Pustakawan"</p>
							<p class="text-[11px] text-ink-muted">Buku akan disorot di etalase beranda depan</p>
						</div>
					</div>
					<input
						type="checkbox"
						bind:checked={isFeatured}
						class="h-4 w-4 cursor-pointer rounded-xs accent-brick"
					/>
				</div>

				<!-- FOOTER BUTTONS -->
				<div class="flex shrink-0 items-center justify-end gap-3 border-t border-ink/15 pt-4">
					<button
						type="button"
						onclick={onClose}
						disabled={isSaving}
						class="focus-library rounded-md border border-ink/20 px-4 py-2 text-xs text-ink transition-colors hover:bg-sand/60 sm:text-sm"
					>
						Batal
					</button>

					<button
						type="submit"
						disabled={isSaving || isUploading}
						class="focus-library flex items-center gap-1.5 rounded-md bg-brick px-5 py-2 text-xs font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 disabled:opacity-50 sm:text-sm"
					>
						{#if isSaving}
							<span>Menyimpan Data...</span>
						{:else}
							<span>{bookToEdit ? 'Simpan Perubahan' : 'Terbitkan Buku'}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
