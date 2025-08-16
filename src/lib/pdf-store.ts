// ============================================================
// SHARED PDF STORE - Buat file: /lib/pdf-store.ts
// ============================================================

/**
 * Global PDF storage yang bisa diakses dari server route dan tools
 * Disimpan di memory (RAM) server, bukan browser storage
 */
class SharedPDFStore {
  private static instance: SharedPDFStore;
  private pdfs = new Map<
    string,
    {
      data: string;
      timestamp: number;
      size: number;
      originalName: string;
    }
  >();

  // Singleton pattern untuk ensure same instance across modules
  static getInstance(): SharedPDFStore {
    if (!SharedPDFStore.instance) {
      SharedPDFStore.instance = new SharedPDFStore();
    }
    return SharedPDFStore.instance;
  }

  /**
   * Store PDF data dengan fileName sebagai key
   */
  store(fileName: string, base64Data: string): void {
    console.log(
      `[PDF Store] Storing PDF: ${fileName} (${base64Data.length} chars)`,
    );

    this.pdfs.set(fileName, {
      data: base64Data,
      timestamp: Date.now(),
      size: base64Data.length,
      originalName: fileName,
    });

    // Auto cleanup setelah 60 menit
    setTimeout(
      () => {
        this.delete(fileName);
        console.log(`[PDF Store] Auto-deleted expired PDF: ${fileName}`);
      },
      60 * 60 * 1000,
    );

    // Debug log
    console.log(`[PDF Store] Total PDFs stored: ${this.pdfs.size}`);
    console.log(
      `[PDF Store] Available files: ${Array.from(this.pdfs.keys()).join(", ")}`,
    );
  }

  /**
   * Get PDF data by fileName
   */
  get(fileName: string): string | null {
    console.log(`[PDF Store] Fetching PDF: ${fileName}`);
    console.log(
      `[PDF Store] Available files: ${Array.from(this.pdfs.keys()).join(", ")}`,
    );

    const stored = this.pdfs.get(fileName);
    if (!stored) {
      console.log(`[PDF Store] PDF not found: ${fileName}`);
      return null;
    }

    // Check expiry (15 menit)
    const isExpired = Date.now() - stored.timestamp > 15 * 60 * 1000;
    if (isExpired) {
      console.log(`[PDF Store] PDF expired: ${fileName}`);
      this.pdfs.delete(fileName);
      return null;
    }

    console.log(`[PDF Store] PDF found: ${fileName} (${stored.size} chars)`);
    return stored.data;
  }

  /**
   * Check if PDF exists
   */
  has(fileName: string): boolean {
    const stored = this.pdfs.get(fileName);
    if (!stored) return false;

    const isExpired = Date.now() - stored.timestamp > 15 * 60 * 1000;
    if (isExpired) {
      this.pdfs.delete(fileName);
      return false;
    }

    return true;
  }

  /**
   * Delete PDF manually
   */
  delete(fileName: string): boolean {
    const deleted = this.pdfs.delete(fileName);
    if (deleted) {
      console.log(`[PDF Store] Deleted PDF: ${fileName}`);
    }
    return deleted;
  }

  /**
   * Get all stored PDF info (untuk debugging)
   */
  getAll(): Array<{ fileName: string; size: number; timestamp: number }> {
    return Array.from(this.pdfs.entries()).map(([fileName, data]) => ({
      fileName,
      size: data.size,
      timestamp: data.timestamp,
    }));
  }

  /**
   * Clear all PDFs
   */
  clear(): void {
    console.log(`[PDF Store] Clearing all PDFs (${this.pdfs.size} files)`);
    this.pdfs.clear();
  }

  /**
   * Get storage stats
   */
  getStats(): { count: number; totalSize: number; files: string[] } {
    let totalSize = 0;
    const files: string[] = [];

    for (const [fileName, data] of this.pdfs.entries()) {
      totalSize += data.size;
      files.push(fileName);
    }

    return {
      count: this.pdfs.size,
      totalSize,
      files,
    };
  }
}

// Export singleton instance
export const pdfStore = SharedPDFStore.getInstance();

// Export class untuk testing
export { SharedPDFStore };

// Helper functions untuk convenience
export const storePDF = (fileName: string, base64Data: string) => {
  pdfStore.store(fileName, base64Data);
};

export const getPDF = (fileName: string): string | null => {
  return pdfStore.get(fileName);
};

export const hasPDF = (fileName: string): boolean => {
  return pdfStore.has(fileName);
};

export const deletePDF = (fileName: string): boolean => {
  return pdfStore.delete(fileName);
};

export const getPDFStats = () => {
  return pdfStore.getStats();
};
