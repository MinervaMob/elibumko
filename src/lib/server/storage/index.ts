/**
 * StorageService — delegasi terpadu ke MediaService
 */

import { mediaService } from '../services/media.service';

export interface IStorageService {
	getFile(fileName: string): Promise<{ buffer: Buffer; mimeType: string; size: number }>;
	saveFile(
		fileName: string,
		buffer: Buffer
	): Promise<{ filePath: string; size: number; fileName: string }>;
	deleteFile(fileName: string): Promise<boolean>;
	fileExists(fileName: string): Promise<boolean>;
}

class StorageAdapter implements IStorageService {
	async getFile(fileName: string) {
		return mediaService.getDocument(fileName);
	}

	async saveFile(fileName: string, buffer: Buffer) {
		const res = await mediaService.saveDocument(fileName, buffer);
		return {
			filePath: res.filePath,
			size: res.size,
			fileName: res.fileName
		};
	}

	async deleteFile(fileName: string) {
		return mediaService.deleteFile('book', fileName);
	}

	async fileExists(fileName: string) {
		return mediaService.fileExists('book', fileName);
	}
}

export const storage: IStorageService = new StorageAdapter();
export { mediaService };
