// ============================================================
// SHARED FILE STORE - Extended untuk handle GeoJSON/JSON files
// ============================================================

// Shared storage untuk file content
const fileStore = new Map<string, string>();

/**
 * Store file content dengan filename sebagai key
 */
export function storeFile(fileName: string, content: string): void {
  fileStore.set(fileName, content);
}

/**
 * Retrieve file content berdasarkan filename
 */
export function getFile(fileName: string): string | undefined {
  return fileStore.get(fileName);
}

/**
 * Check apakah file exists
 */
export function hasFile(fileName: string): boolean {
  return fileStore.has(fileName);
}

/**
 * Delete file dari store
 */
export function deleteFile(fileName: string): boolean {
  return fileStore.delete(fileName);
}

/**
 * Get all stored filenames
 */
export function getStoredFiles(): string[] {
  return Array.from(fileStore.keys());
}

/**
 * Get storage stats
 */
export function getFileStoreStats(): {
  totalFiles: number;
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
} {
  const files = Array.from(fileStore.entries()).map(([name, content]) => ({
    name,
    size: content.length,
    type: name.endsWith(".geojson")
      ? "geojson"
      : name.endsWith(".json")
        ? "json"
        : "unknown",
  }));

  return {
    totalFiles: files.length,
    files,
  };
}

/**
 * Clear all stored files
 */
export function clearFileStore(): void {
  fileStore.clear();
}

// ============================================================
// PDF STORE - Keep existing functionality
// ============================================================

const pdfStore = new Map<string, string>();

export function storePDF(fileName: string, base64Data: string): void {
  pdfStore.set(fileName, base64Data);
}

export function getPDF(fileName: string): string | undefined {
  return pdfStore.get(fileName);
}

export function hasPDF(fileName: string): boolean {
  return pdfStore.has(fileName);
}

export function deletePDF(fileName: string): boolean {
  return pdfStore.delete(fileName);
}

export function getPDFStats(): {
  totalPDFs: number;
  pdfs: Array<{
    name: string;
    size: number;
  }>;
} {
  const pdfs = Array.from(pdfStore.entries()).map(([name, data]) => ({
    name,
    size: data.length,
  }));

  return {
    totalPDFs: pdfs.length,
    pdfs,
  };
}
