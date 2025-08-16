// ============================================================
// COMPLETE TYPES - File Storage Integration
// ============================================================

type BasePart<Data extends object> =
  | {
      /**
       * optional name for the part, useful for display purposes
       * or to identify the part in a list.
       */
      name?: string;
      /**
       * the state of the part, when the state is "in-progress",
       * the part is being processed and the data is not yet available.
       */
      state: "in-progress";
    }
  | {
      name?: string;
      /**
       * the state of the part, when the state is "failed",
       * the part has failed to be processed and the data is not available.
       */
      state: "failed";
      /**
       * an error message describing the failure.
       */
      error?: string;
    }
  | ({
      name?: string;
      /**
       * the state of the part, when the state is "completed",
       * the part has been processed and the data is available.
       */
      state: "completed";
    } & Data);

/**
 * Attachment types yang bisa di-upload user
 */
export type AttachmentType = "geojson" | "json" | "csv" | "xlsx" | "pdf";

/**
 * Base attachment structure - UPDATED untuk file storage
 */
export type BaseAttachment = {
  id: string;
  name: string;
  size: number;
  type: AttachmentType;
  /**
   * CHANGED: Content sekarang optional dan bisa berupa:
   * - undefined: file disimpan di storage, tidak ada di attachment
   * - string: content penuh (untuk backward compatibility)
   * - "[STORED]": indicator bahwa file sudah disimpan di storage
   */
  content?: string;
  /**
   * Flag untuk menentukan apakah content harus di-hide di UI
   */
  hideContent: boolean;
  /**
   * NEW: Flag untuk menandakan bahwa file sudah disimpan di server storage
   */
  fileStored?: boolean;
  /**
   * NEW: Storage method yang digunakan
   */
  storageMethod?: "memory" | "disk" | "database";
};

/**
 * GeoJSON specific attachment - UPDATED
 */
export type GeoJSONAttachment = BaseAttachment & {
  type: "geojson";
  /**
   * CHANGED: parsedGeoJSON sekarang optional karena content mungkin di storage
   */
  parsedGeoJSON?: any;
  /**
   * Metadata yang di-extract dari GeoJSON
   */
  metadata?: {
    featureCount: number;
    bounds: [number, number, number, number];
    geometryTypes: string[];
    /**
     * NEW: Storage reference info
     */
    storageKey?: string;
    lastAccessed?: string;
  };
};

/**
 * JSON specific attachment - NEW
 */
export type JSONAttachment = BaseAttachment & {
  type: "json";
  /**
   * Parsed JSON object (hanya ada jika content tidak hidden)
   */
  parsedJSON?: any;
  /**
   * Metadata yang di-extract dari JSON
   */
  metadata?: {
    recordCount: number;
    fieldCount: number;
    dataStructure: "array" | "object" | "primitive";
    /**
     * Storage reference info
     */
    storageKey?: string;
    lastAccessed?: string;
  };
};

/**
 * CSV specific attachment - NEW
 */
export type CSVAttachment = BaseAttachment & {
  type: "csv";
  /**
   * Parsed CSV data (hanya ada jika content tidak hidden)
   */
  parsedCSV?: any[];
  /**
   * Metadata yang di-extract dari CSV
   */
  metadata?: {
    rowCount: number;
    columnCount: number;
    headers: string[];
    delimiter: string;
    /**
     * Storage reference info
     */
    storageKey?: string;
    lastAccessed?: string;
  };
};

/**
 * XLSX specific attachment - NEW
 */
export type XLSXAttachment = BaseAttachment & {
  type: "xlsx";
  /**
   * Parsed XLSX data (hanya ada jika content tidak hidden)
   */
  parsedXLSX?: {
    sheets: Record<string, any[]>;
    sheetNames: string[];
  };
  /**
   * Metadata yang di-extract dari XLSX
   */
  metadata?: {
    sheetCount: number;
    totalRows: number;
    sheetInfo: Array<{
      name: string;
      rowCount: number;
      columnCount: number;
    }>;
    /**
     * Storage reference info
     */
    storageKey?: string;
    lastAccessed?: string;
  };
};

/**
 * PDF specific attachment - UPDATED
 */
export type PDFAttachment = BaseAttachment & {
  type: "pdf";
  /**
   * NEW: Base64 data untuk PDF (akan disimpan di storage)
   */
  pdfData?: string;
  /**
   * CHANGED: extractedLCAM sekarang optional karena content mungkin di storage
   */
  extractedLCAM?: LCAMDocument;
  /**
   * Metadata yang di-extract dari PDF
   */
  metadata?: {
    pageCount?: number;
    extractionMethod: string;
    processingTime?: number;
    /**
     * NEW: Storage reference info
     */
    storageKey?: string;
    lastAccessed?: string;
  };
};

/**
 * Union type untuk semua attachment types - UPDATED
 */
export type Attachment =
  | GeoJSONAttachment
  | PDFAttachment
  | JSONAttachment
  | CSVAttachment
  | XLSXAttachment
  | BaseAttachment;

/**
 * Message structure dengan support untuk attachments - UPDATED
 */
export type MessageWithAttachments = {
  id: string;
  role: "user" | "assistant";
  parts: Array<{
    type:
      | "text"
      | "data-document-lcam-processing"
      | "data-analyze-carbon-stock"
      | "data-compare-carbon-credits"
      | "tool-analyze-carbon-stock"
      | "carbon-stock-analysis"
      | "tool-upload-lcam-pdf";
    text: string;
  }>;
  /**
   * Attachments yang di-upload oleh user
   */
  attachments?: Attachment[];
  /**
   * Timestamp ketika message dibuat
   */
  timestamp?: number;
  /**
   * NEW: Storage metadata untuk message ini
   */
  storageMetadata?: {
    hasStoredFiles: boolean;
    storedFileCount: number;
    totalStorageSize: number;
  };
};

/**
 * Context type untuk LLM yang memiliki akses penuh ke content
 */
export type LLMContext = {
  id: string;
  messages: MessageWithAttachments[];
  /**
   * Flag untuk menandakan bahwa ini adalah context untuk LLM
   * yang memiliki akses ke full content
   */
  isLLMContext: true;
};

/**
 * Context type untuk UI yang content-nya di-hide
 */
export type UIContext = {
  id: string;
  messages: MessageWithAttachments[];
  /**
   * Flag untuk menandakan bahwa ini adalah context untuk UI
   * yang content attachment-nya hidden
   */
  isLLMContext: false;
};

/**
 * show specific point on the map, with optional zoom, pitch and bearing.
 */
export type MapsPoint = BasePart<{
  latitude: number;
  longitude: number;
  /**
   * additional map view options
   */
  zoom?: number;
  pitch?: number;
  bearing?: number;
}>;

/**
 * weather condition types
 */
export type WeatherCondition =
  | "sunny"
  | "partly-cloudy"
  | "cloudy"
  | "overcast"
  | "drizzle"
  | "light-rain"
  | "rain"
  | "heavy-rain"
  | "thunderstorm"
  | "snow"
  | "light-snow"
  | "heavy-snow"
  | "sleet"
  | "hail"
  | "fog"
  | "mist"
  | "windy"
  | "clear"
  | "unknown";

/**
 * display weather information for a specific location.
 */
export type WeatherData = BasePart<{
  /**
   * the time when the weather data was collected, in ISO 8601 format.
   */
  time: string;
  /**
   * location information, such as city or region.
   */
  location: string;
  /**
   * humidity is the percentage of water vapor in the air.
   * It is a measure of how much moisture is present in the atmosphere.
   */
  humidity: number;
  /**
   * temperature is the current temperature in degrees Celsius.
   */
  temperature: number;
  /**
   * precipitation is the amount of precipitation in millimeters.
   * It includes rain, snow, sleet, and hail.
   */
  precipitation: number;
  /**
   * the current weather condition, such as sunny, cloudy, rainy, etc.
   */
  condition: WeatherCondition;
}>;

/**
 * GeoJSON vector data for map visualization - UPDATED
 */
export type MapsGeoJSON = BasePart<{
  geojson: any; // GeoJSON object
  style: {
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity: number;
  };
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

  featureCount?: number;
  analysis?: any;
  dataType?: "geojson" | "json"; // Type of data stored
  originalSize?: number; // Size of the original file in bytes
  /**
   * UPDATED: Source tracking untuk file storage
   */
  sourceAttachmentId?: string;
  sourceAttachmentName?: string;
  /**
   * NEW: Storage source information
   */
  sourceStorage?: {
    method: "attachment" | "stored" | "direct";
    storageKey?: string;
    retrievedAt?: string;
  };
}>;

/**
 * Carbon stock statistics structure
 */
export type CarbonStats = {
  totalCarbon: number;
  averageCarbon: number;
  maxCarbon: number;
  minCarbon: number;
  carbonByClass: Record<
    number,
    {
      count: number;
      totalCarbon: number;
      averageCarbon: number;
    }
  >;
  totalArea: number; // in hectares
  pixelCount: number;
};

/**
 * Carbon metrics structure
 */
export type CarbonMetrics = {
  area: number;
  carbonStocks: number;
  forestGrowth: number;
  leakage: number;
  netSequestration: number;
  minMarketableCredits: number;
  maxMarketableCredits: number;
  yearsSinceBaseline: number;
};

/**
 * Yearly analysis result structure
 */
export type YearlyAnalysisResult = {
  baselineTotalPoints: any;
  baselineStats: any;
  stats: CarbonStats;
  totalPoints: number;
  metrics: CarbonMetrics;
};
/**
 * NEW: Carbon measurement result
 */
export type MeasurementCarbon = BasePart<{
  baselineYear: number;
  analyzedYears: number[];
  requestedYears: number[];
  baselineYears: number[];
  timeSeriesData: {
    year: number;
    baselineYear: number;
    carbonStocks: number;
    baselineCarbonStocks: number;
    forestGrowth: number;
    leakage: number;
    netSequestration: number;
    minMarketableCredits: number;
    maxMarketableCredits: number;
    yearsSinceBaseline: number;
    cumulativeGrowth: number;
    annualGrowthRate: number;
  }[];
  summaryMetrics: {
    totalYearsAnalyzed: number;
    averageAnnualGrowth: number;
    totalCumulativeGrowth: number;
    averageNetSequestration: number;
    totalMinMarketableCredits: number;
    totalMaxMarketableCredits: number;
    totalNetSequestration: number;
    bestPerformingYear: {
      year: number;
      baselineYear: number;
      carbonStocks: number;
      baselineCarbonStocks: number;
      forestGrowth: number;
      leakage: number;
      netSequestration: number;
      minMarketableCredits: number;
      maxMarketableCredits: number;
      yearsSinceBaseline: number;
      cumulativeGrowth: number;
      annualGrowthRate: number;
    };
    worstPerformingYear: {
      year: number;
      baselineYear: number;
      carbonStocks: number;
      baselineCarbonStocks: number;
      forestGrowth: number;
      leakage: number;
      netSequestration: number;
      minMarketableCredits: number;
      maxMarketableCredits: number;
      yearsSinceBaseline: number;
      cumulativeGrowth: number;
      annualGrowthRate: number;
    };
    trends: {
      growthTrend: string;
      sequestrationTrend: string;
    };
  };
  carbonClassAnalysis: Record<string, any>;
  geojsonLayerId: string;
  baselineStats: CarbonStats;
  yearlyResults: Record<number, YearlyAnalysisResult>;
  baselineResults: Record<number, YearlyAnalysisResult>;
  bounds: number[]; // [minLng, minLat, maxLng, maxLat]
  measurementArea: number; // in hectares
  metadata: {
    analysisDate: string;
    totalDataPoints: number;
    totalBaselinePoints: number;
    dataQuality: string;
    yearBaselinePairs: number;
  };
  /**
   * Processing summary
   */
  summary?: {
    totalYearsAnalyzed: number;
    averageAnnualGrowth: number;
    totalNetSequestration: number;
    estimatedCreditsRange: {
      min: number;
      max: number;
    };
  };
  /**
   * Optional: Method yang digunakan untuk mendapatkan GeoJSON
   */
  geojsonSource?: string;
  /**
   * Optional: Nama file GeoJSON yang digunakan
   */
  geojsonFileName?: string;
}>;

/**
 * UPDATED: Single year measurement (untuk backward compatibility)
 */
export type MeasurementReclassify = BasePart<{
  year: number;
  baselineYear?: number; // Optional untuk single year
  geojsonLayerId: string;
  totalPoints: number;
  totalPointsOriginal: number;
  carbonStats: CarbonStats;
  bounds: number[]; // [minLng, minLat, maxLng, maxLat]
  measurementArea: number; // in hectares
  /**
   * Optional metrics untuk single year
   */
  metrics?: CarbonMetrics;
  /**
   * Optional: Method yang digunakan untuk mendapatkan GeoJSON
   */
  geojsonSource?: string;
  /**
   * Optional: Nama file GeoJSON yang digunakan
   */
  geojsonFileName?: string;
}>;

/**
 * Forest growth analysis structure
 */
export type ForestGrowthAnalysis = {
  carbonChange: number; // Change in total carbon stock (Mg C)
  carbonChangePercentage: number; // Percentage change
  areaChange: number; // Change in forest area (hectares)
  areaChangePercentage: number; // Percentage change in area
  averageCarbonChange: number; // Change in average carbon density
  deforestation: {
    area: number; // hectares
    carbonLoss: number; // Mg C
  };
  reforestation: {
    area: number; // hectares
    carbonGain: number; // Mg C
  };
  degradation: {
    area: number; // hectares
    carbonLoss: number; // Mg C
  };
  enhancement: {
    area: number; // hectares
    carbonGain: number; // Mg C
  };
};

/**
 * GeoJSON vector data for measure forest growth
 */
export type MeasurementForestGrowth = BasePart<{
  startYear: number;
  endYear: number;
  geojsonLayerId: string;
  timespan: number; // in years
  totalPointsStart: number;
  totalPointsEnd: number;
  totalPointsOriginalStart: number;
  totalPointsOriginalEnd: number;
  statsStart: CarbonStats;
  statsEnd: CarbonStats;
  growthAnalysis: any;
  measurementArea: number; // in hectares
  /**
   * Optional: Method yang digunakan untuk mendapatkan GeoJSON
   */
  geojsonSource?: "attachment" | "processed" | "latest" | "stored";
  /**
   * Optional: Nama file GeoJSON yang digunakan
   */
  geojsonFileName?: string;
}>;

/**
 * Auto carbon measurement result yang menggabungkan processing dan measurement
 */
export type AutoCarbonMeasurement = BasePart<{
  year: number;
  geojsonIdentifier: string;
  totalPoints: number;
  totalPointsOriginal: number;
  carbonStats: CarbonStats;
  bounds: number[];
  measurementArea: number;
  /**
   * Processing details
   */
  processingDetails: {
    geojsonSource: "attachment" | "processed" | "latest" | "stored";
    geojsonFileName?: string;
    processingTime?: number;
  };
  /**
   * Summary untuk display
   */
  summary: {
    totalCarbonFormatted: string;
    averageCarbonFormatted: string;
    areaFormatted: string;
    dataQuality: "excellent" | "good" | "fair" | "poor";
  };
}>;

/**
 * LCAM Document structure
 */
type LCAMDocument = {
  ringkasan_eksekutif?: {
    judul_kegiatan_aksi_mitigasi?: string;
    tujuan_dan_lingkup_verifikasi?: string;
    periode_laporan_pemantauan?: string;
    versi_laporan?: string;
    tanggal_laporan?: string;
    jenis_grk?: string[];
    periode_penaatan?: string;
    total_area?: string;
    area_bervegetasi?: string;
  };

  informasi_umum?: {
    judul_kegiatan?: string;
    nomor_akun_srn_ppi?: string;
    deskripsi_ringkas?: string;
    komponen_konservasi?: {
      persentase_area?: string;
      perlindungan_area?: string;
      pencegahan_konversi?: string;
      pemeliharaan_carbon_stock?: string;
    };
    komponen_restorasi?: {
      persentase_area?: string;
      restorasi_area_terdegradasi?: string;
      peningkatan_kualitas_hutan?: string;
      rehabilitasi_lahan_terbuka?: string;
      penanaman_bibit?: string;
    };
    target_mitigasi?: {
      net_carbon_benefit?: string;
      durasi_tahun?: string;
      rata_rata_tahunan?: string;
      enhancement_restorasi?: string;
    };
    tujuan_umum_dan_khusus?: string;
    alamat_dan_lokasi?: {
      lokasi_tapak?: string;
      latitude?: string;
      longitude?: string;
      wilayah_administratif?: string[];
    };
    pemilik_kegiatan?: {
      project_owner?: string;
      technical_partner?: string;
      community_partner?: string;
    };
    narahubung?: {
      narahubung_utama?: {
        nama_lengkap?: string;
        jabatan?: string;
        email?: string;
        no_telepon?: string;
      };
      narahubung_teknis?: {
        nama_lengkap?: string;
        jabatan?: string;
        email?: string;
        no_telepon?: string;
      };
    };
    metodologi_perhitungan?: string;
  };

  lembaga_verifikasi?: {
    identitas_lembaga?: {
      nama_lembaga?: string;
      akreditasi_indonesia?: string;
      masa_berlaku?: string;
      pemberi_akreditasi?: string;
      amandemen?: string;
      perluasan_ruang_lingkup?: string;
    };
    alamat_lembaga?: {
      nama_perusahaan?: string;
      alamat?: string;
      email?: string;
      no_telepon?: string;
      website?: string;
    };
    manajemen_penanggung_jawab?: {
      nama?: string;
      jabatan?: string;
    };
    ketua_tim_verifikator?: {
      nama?: string;
      kompetensi?: string;
      tugas_tanggung_jawab?: string;
      sertifikasi?: string[];
    };
    verifikator_senior?: {
      nama?: string;
      spesialisasi?: string;
      kompetensi?: string;
      tugas_tanggung_jawab?: string;
      sertifikasi?: string[];
    };
    verifikator_spesialis?: {
      nama?: string;
      spesialisasi?: string;
      kompetensi?: string;
      tugas_tanggung_jawab?: string;
      sertifikasi?: string[];
    };
    tenaga_ahli?: string;
    peninjau_independen?: {
      nama?: string;
      kompetensi?: string;
      tugas_tanggung_jawab?: string;
      sertifikasi?: string[];
    };
  };

  personel_wawancara?: Array<{
    no?: number;
    nama_interviewee?: string;
    jabatan?: string;
    organisasi?: string;
    topik_yang_dibahas?: string;
    verifikator?: string;
  }>;

  kunjungan_tapak?: {
    tanggal_kunjungan?: string;
    lokasi_dikunjungi?: string[];
    kegiatan_dilakukan?: string[];
    temuan_lapangan?: string;
  };

  penilaian_lcam?: {
    ringkasan_kuantifikasi?: {
      periode_laporan?: Array<{
        tahun?: number;
        periode?: string;
        pengurangan_emisi_grk?: number;
        emisi_baseline?: number;
        emisi_aksi_mitigasi?: number;
        kebocoran_leakage?: number;
      }>;
      total_kuantifikasi?: {
        pengurangan_emisi_grk?: number;
        emisi_baseline?: number;
        emisi_aksi_mitigasi?: number;
        kebocoran_leakage?: number;
      };
    };
    perbandingan_dram_lcam?: {
      periode_perbandingan?: Array<{
        tahun?: number;
        periode?: string;
        dram?: number;
        lcam?: number;
        selisih?: number;
      }>;
      total_perbedaan?: {
        dram?: number;
        lcam?: number;
        selisih?: number;
      };
    };
  };

  // proses_verifikasi?: {
  //   lingkup_verifikasi?: string;
  //   kriteria_verifikasi?: string[];
  //   tingkat_jaminan?: string;
  //   ambang_materialitas?: string;
  //   metode_pelaksanaan?: string[];
  //   waktu_pelaksanaan?: string;
  //   standar_yang_digunakan?: string[];
  // };
};

/**
 * Document LCAM processing result - UPDATED
 */
export type DocumentLCAM = BasePart<{
  documentId: string;
  extractedData: LCAMDocument;
  /**
   * Processing metadata
   */
  processingDetails: {
    extractionMethod: string;
    fieldsExtracted: number;
    timestamp: string;
  };
  /**
   * Document metadata
   */
  documentMetadata: {
    fileName?: string;
    fileSize?: number;
    processingTime?: number;
  };
  /**
   * Preview of the extracted content
   */
  contentPreview: string;
  /**
   * NEW: Storage source information
   */
  sourceStorage?: {
    method: "attachment" | "stored" | "direct";
    storageKey?: string;
    retrievedAt?: string;
  };
}>;

/**
 * Parts collection
 */
export type Parts = {
  "maps-point": MapsPoint;
  weather: WeatherData;
  "maps-geojson": MapsGeoJSON;
  "analyze-carbon-stock": MeasurementCarbon;
  "document-lcam-processing": DocumentLCAM;
  "compare-carbon-credits": CompareCarbonCredit;
  "carbon-stock-report": CarbonStockReport;
  "anomaly-detection": DataAnomalyDetection;
  "environmental-red-flag-1": DataEnvironmentalRedFlag1; // NEW: No actual carbon reduction activities
  "environmental-red-flag-2": DataEnvironmentalRedFlag2; // NEW: No actual carbon reduction activities
  // NEW: Financial Red Flags
  "financial-red-flag-1": DataFinancialRedFlag1; // PEPs analysis
  "financial-red-flag-2": DataFinancialRedFlag2; // Trading patterns analysis

  // NEW: Integrated Analysis
  "integrated-critical-findings": DataIntegratedCriticalFindings; // Comprehensive findings
};

/**
 * Helper type untuk data yang dikirim ke writer
 */
export type WriterData<T extends keyof Parts> = {
  id: string;
  type: `data-${T}`;
  data: Parts[T];
};

/**
 * File storage context - NEW
 */
export type FileStorageContext = {
  /**
   * Available stored files
   */
  availableFiles: Array<{
    fileName: string;
    fileType: AttachmentType;
    size: number;
    storedAt: string;
  }>;
  /**
   * Storage statistics
   */
  stats: {
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<AttachmentType, number>;
  };
};

/**
 * Storage-aware search results - UPDATED
 */
export type GeoJSONSearchResult = {
  geojson: any;
  source: "attachment" | "processed" | "stored";
  id: string;
  name: string;
  timestamp?: number;
  /**
   * NEW: Storage information
   */
  storageInfo?: {
    storageKey: string;
    method: "memory" | "disk";
    lastAccessed: string;
  };
};

export type LCAMSearchResult = {
  document: LCAMDocument;
  source: "attachment" | "processed" | "stored";
  id: string;
  name: string;
  timestamp?: number;
  /**
   * NEW: Storage information
   */
  storageInfo?: {
    storageKey: string;
    method: "memory" | "disk";
    lastAccessed: string;
  };
};

/**
 * Available layers with storage info - UPDATED
 */
export type AvailableGeoJSONLayer = {
  id: string;
  name: string;
  featureCount: number;
  timestamp?: number;
  source: "attachment" | "processed" | "stored";
  attachmentName?: string;
  /**
   * NEW: Storage metadata
   */
  storageMetadata?: {
    storageKey: string;
    size: number;
    lastAccessed: string;
  };
};

export type AvailableLCAMDocument = {
  id: string;
  name: string;
  timestamp?: number;
  source: "attachment" | "processed" | "stored";
  attachmentName?: string;
  extractionMethod?: string;
  /**
   * NEW: Storage metadata
   */
  storageMetadata?: {
    storageKey: string;
    size: number;
    lastAccessed: string;
  };
};

/**
 * Helper types untuk tools - NEW
 */
export type FileReference = {
  fileName: string;
  source: "stored" | "direct";
  storageKey?: string;
};

export type ProcessingResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    processingTime: number;
    sourceFile: FileReference;
    outputSize: number;
  };
};

/**
 * Discrepancy calculation result
 */
export type DiscrepancyResult = {
  absolute: number;
  percentage: number;
  type: "overestimate" | "underestimate" | "matched";
};

/**
 * Source information for comparison data
 */
export type ComparisonDataSource = {
  analysisId?: string | null;
  documentId?: string | null;
  baselineYear?: number;
  analyzedYears?: number[];
  measurementArea?: number;
  documentName?: string;
  verificationBody?: string;
  fileName?: string;
  extractionMethod?: string;
};

/**
 * Carbon stock data from analysis
 */
export type CarbonStockData = {
  minMarketableCredits: number;
  maxMarketableCredits: number;
  netSequestration: number;
  forestGrowth: number;
  marketableCreditsMin?: number; // Calculated from netSequestration
  marketableCreditsMax?: number; // Calculated from netSequestration
};

/**
 * LCAM data from document extraction
 */
export type LCAMData = {
  pengurangan_emisi_grk: number;
  emisi_baseline?: number;
  emisi_aksi_mitigasi?: number;
  kebocoran_leakage?: number;
  marketableCreditsMin?: number; // Calculated from pengurangan_emisi_grk
  marketableCreditsMax?: number; // Calculated from pengurangan_emisi_grk
};

/**
 * Yearly comparison result
 */
export type YearlyComparisonResult = {
  year: number;
  period?: string;
  carbonStock: CarbonStockData;
  lcam: LCAMData;
  discrepancy: {
    netSequestration: DiscrepancyResult; // Main comparison: ton CO2e
    marketableCreditsMin: DiscrepancyResult; // Credits comparison min
    marketableCreditsMax: DiscrepancyResult; // Credits comparison max
  };
  recommendedValues: {
    netSequestrationTonCO2e: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
    marketableCredits: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
  };
};

/**
 * Summary statistics for the entire comparison
 */
export type ComparisonSummaryStatistics = {
  totalYearsCompared: number;
  averageDiscrepancyPercentage: number;
  totalLCAMReduction: number;
  totalCarbonStockNetSequestration: number;
  correlationAnalysis: {
    netSequestrationCorrelation:
      | "insufficient_data"
      | "strong_correlation"
      | "moderate_correlation"
      | "weak_correlation"
      | "poor_correlation";
    marketableCreditsCorrelation:
      | "insufficient_data"
      | "strong_correlation"
      | "moderate_correlation"
      | "weak_correlation"
      | "poor_correlation";
  };
  recommendedValues: {
    netSequestrationTonCO2e: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
    marketableCredits: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
  };
};

/**
 * Total comparison metrics
 */
export type TotalComparisonMetrics = {
  lcamTotalReduction: number;
  carbonStockTotalNetSequestration: number;
  netSequestrationDiscrepancy: DiscrepancyResult;
  marketableCreditsComparison: {
    lcamBased: {
      min: number;
      max: number;
    };
    carbonStockBased: {
      min: number;
      max: number;
    };
  };
};

/**
 * Quality assessment for the comparison
 */
export type QualityAssessment = {
  dataReliability: string;
  recommendedApproach: string;
  confidenceLevel: string;
  methodAgreement: string;
};

/**
 * Risk assessment for the comparison
 */
export type RiskAssessment = {
  overestimationRisk: "high" | "low";
  underestimationRisk: "high" | "low";
  dataQualityRisk: "high" | "low";
};

/**
 * Recommendations based on comparison results
 */
export type ComparisonRecommendations = {
  netSequestrationValues: {
    conservative: number;
    moderate: number;
    optimistic: number;
  };
  marketableCreditsValues: {
    conservative: number;
    moderate: number;
    optimistic: number;
  };
  preferredMethod: string;
  methodAgreement: string;
  riskAssessment: RiskAssessment;
};

/**
 * Comparison parameters used
 */
export type ComparisonParameters = {
  yearsCompared: number[];
  creditPriceRange: {
    min: number;
    max: number;
  };
  includeDetailedBreakdown: boolean;
};

/**
 * Metadata for the comparison
 */
export type ComparisonMetadata = {
  comparisonDate: string;
  totalYearsAnalyzed: number;
  dataQuality: string;
  processingTime: number;
};

/**
 * Complete comparison result structure
 */
export type CompareCarbonCredit = BasePart<{
  /**
   * Source information for both datasets
   */
  carbonStockSource: ComparisonDataSource;
  lcamSource: ComparisonDataSource;

  /**
   * Parameters used for the comparison
   */
  comparisonParameters: ComparisonParameters;

  /**
   * Detailed yearly comparison (optional if includeDetailedBreakdown is false)
   */
  yearlyComparison?: YearlyComparisonResult[];

  /**
   * Summary statistics across all years
   */
  summaryStatistics: ComparisonSummaryStatistics;

  /**
   * Total comparison metrics
   */
  totalComparison: TotalComparisonMetrics;

  /**
   * Quality assessment
   */
  qualityAssessment: QualityAssessment;

  /**
   * Recommendations based on analysis
   */
  recommendations: ComparisonRecommendations;

  /**
   * Processing metadata
   */
  metadata: ComparisonMetadata;

  /**
   * Optional: Storage source information
   */
  sourceStorage?: {
    carbonAnalysisId?: string;
    lcamDocumentId?: string;
    comparisonMethod: "net-sequestration-vs-lcam";
  };

  /**
   * Summary for quick overview
   */
  summary?: {
    totalYearsCompared: number;
    averageDiscrepancy: number;
    methodAgreement: string;
    recommendedApproach: string;
    dataReliability: string;
  };
}>;

/**
 * Carbon Stock Report generation result structure
 */
export type CarbonStockReport = BasePart<{
  /**
   * Report metadata
   */

  metadata: {
    reportTitle: string;
    generatedDate: string;
    reportId: string;
    dataSources: {
      carbonAnalysisId: string;
      lcamDocumentId: string;
      comparisonAnalysisId: string;
    };
    coverageArea: number;
    analysisYears: number[];
    riskLevel: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  };
  anomalyDetection: any;
  redFlagAnalysis: any;
  /**
   * Main report content sections
   */
  content: {
    // Basic project information
    judul_kegiatan: string;
    pemilik: string;
    lokasi: string;
    latitude: string;
    longitude: string;
    total_area: string;
    vegetasi_area: string;
    deskripsi_singkat: string;
    tujuan_umum_khusus: string;
    partner_teknis: string;
    partner_komunitas: string;
    periode_penataan: string;
    periode_pelaporan: string;

    // Technical analysis sections
    remote_sensing_land_use_change: string;
    remote_sensing_carbon_pool: string;
    compare_carbon_stock_lcam_remote_sensing: string;
    potential_credit_carbon: string;
    carbon_pricing_economic_valuation: string;
    anomaly_detection: string;
    critical_finding: string;

    // Red flag analysis sections
    no_activity: string;
    overlap_hutan_lindung: string;
    political_actor: string;
    individual_transaction: string;

    // Personnel information sections
    pemilik_persons: string;
    partner_teknis_persons: string;
    verification_teams_person: string;

    // Conclusion and recommendations
    conclusion: string;
    recomendation: string;
  };

  /**
   * Optional raw data (included if includeRawData is true)
   */
  rawData?: {
    carbonStockData: any;
    lcamExtractedData: LCAMDocument;
    comparisonData?: any;
  };

  /**
   * Report summary for quick overview
   */
  summary: {
    projectTitle: string;
    riskLevel: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
    totalArea: string;
    analysisYears: number;
    hasComparison: boolean;
    hasAnomalyDetection: boolean;
    hasRedFlagAnalysis: boolean;
    redFlagRiskLevel: any;
    keyFindings: string;
  };

  /**
   * Processing details
   */
  processingDetails: {
    generationTime: number;
    dataSourcesUsed: string[];
    includeRawData: boolean;
    contentSections: number;
    hasStructuredTables: boolean;
    hasAnomalyDetection: boolean;
    hasRedFlagAnalysis: boolean;
    redFlagAnalysesCount: number;
  };

  /**
   * Optional: Storage source information
   */
  sourceStorage?: {
    carbonAnalysisId?: string;
    lcamDocumentId?: string;
    comparisonAnalysisId?: string;
    generatedFrom: "comprehensive-analysis";
  };
  report: any;
}>;

/**
 * Anomaly detection focus area options
 */
export type AnomalyFocusArea =
  | "financial_crime"
  | "technical_anomaly"
  | "comprehensive";

/**
 * Risk level assessment for anomaly detection
 */
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";

/**
 * Investigation priority level
 */
export type InvestigationPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

/**
 * Data sources used indicator
 */
export type DataSourcesUsed = {
  carbonAnalysis: boolean;
  lcamDocument: boolean;
  comparison: boolean;
};

/**
 * Analysis metrics for anomaly detection
 */
export type AnomalyAnalysisMetrics = {
  discrepancyPercentage: number;
  discrepancyValue: number;
  totalLCAM: number;
  totalAI: number;
};

/**
 * Project information structure
 */
export type AnomalyProjectInfo = {
  name: string;
  owner: string;
  location: string;
  area: number;
  years: number[];
};

/**
 * Red flag integration summary structure
 */
export type RedFlagIntegration = {
  environmentalIssues: string[];
  financialIssues: string[];
  crossCuttingConcerns: string[];
  overallRedFlagSeverity: RedFlagSeverity;
};

/**
 * Red flag sources tracking
 */
export type RedFlagSources = {
  integratedCriticalFindings: boolean;
  environmentalRedFlag1: boolean;
  environmentalRedFlag2: boolean;
  financialRedFlag1: boolean;
  financialRedFlag2: boolean;
  totalRedFlagsUsed: number;
};
/**
 * Anomaly detection result structure
 */

export type DataAnomalyDetection = BasePart<{
  /**
   * Generated anomaly narrative in Indonesian
   */
  anomalyNarrative: string;

  /**
   * NEW: Comprehensive narrative integrating all red flag findings
   */
  integratedRedFlagNarrative: string;

  /**
   * Overall risk assessment
   */
  riskLevel: RiskLevel;

  /**
   * Key findings and red flags
   */
  keyFindings: string[];

  /**
   * Estimated economic impact in IDR
   */
  economicImpact: number;

  /**
   * Investigation priority level
   */
  investigationPriority: InvestigationPriority;

  /**
   * Recommended actions for PPATK investigation
   */
  recommendedActions: string[];

  /**
   * NEW: Red flag integration summary
   */
  redFlagIntegration: RedFlagIntegration;

  /**
   * Analysis metrics used for detection
   */
  analysisMetrics: AnomalyAnalysisMetrics;

  /**
   * Project information
   */
  projectInfo: AnomalyProjectInfo;

  /**
   * NEW: Red flag sources tracking
   */
  redFlagSources: RedFlagSources;

  /**
   * Focus area of the analysis
   */
  focusArea: AnomalyFocusArea;

  /**
   * NEW: Whether red flags were included in analysis
   */
  includeRedFlags: boolean;

  /**
   * Generation timestamp
   */
  generatedAt: string;

  /**
   * Data sources used for analysis
   */
  dataSourcesUsed: DataSourcesUsed & {
    redFlagAnalysis: boolean; // NEW: Added red flag analysis indicator
  };

  /**
   * UPDATED: Summary for quick overview with red flag severity
   */
  summary?: {
    projectName: string;
    riskLevel: RiskLevel;
    discrepancy: string;
    economicImpact: string;
    investigationPriority: InvestigationPriority;
    redFlagSeverity: RedFlagSeverity; // NEW: Overall red flag severity
    focusArea: AnomalyFocusArea;
    redFlagsIntegrated: boolean; // NEW: Flag indicating red flag integration
  };

  /**
   * Processing details
   */
  processingDetails?: {
    generationTime: number;
    dataSourcesFound: string[];
    analysisMethod: string;
    aiModel: string;
  };

  /**
   * Optional: Storage source information
   */
  sourceStorage?: {
    carbonAnalysisId?: string;
    lcamDocumentId?: string;
    comparisonAnalysisId?: string;
    generatedFrom: "carbon sensing";
  };
}>;

/**
 * Red flag severity levels
 */
export type RedFlagSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/**
 * Investigation target structure
 */
export type InvestigationTarget = {
  name: string;
  role: string;
  suspiciousActivity: string;
};

/**
 * Analysis metrics for environmental red flags
 */
export type EnvironmentalRedFlagMetrics = {
  discrepancyPercentage: number;
  phantomCredits: number;
  economicImpact: number;
};

/**
 * Environmental Red Flag 1 - No Actual Carbon Reduction Activities
 */
export type DataEnvironmentalRedFlag1 = BasePart<{
  /**
   * Comprehensive red flag narrative in Indonesian
   */
  redFlagNarrative: string;

  /**
   * Severity level of the environmental red flag
   */
  severity: RedFlagSeverity;

  /**
   * Key findings from the analysis
   */
  keyFindings: string[];

  /**
   * Key personnel to investigate
   */
  investigationTargets: InvestigationTarget[];

  /**
   * Recommended investigation actions
   */
  recommendedActions: string[];

  /**
   * Financial areas to focus investigation on
   */
  financialFocusAreas: string[];

  /**
   * Analysis metrics
   */
  analysisMetrics: EnvironmentalRedFlagMetrics;

  /**
   * Generation timestamp
   */
  generatedAt: string;

  /**
   * Summary for quick overview
   */
  summary?: {
    projectName: string;
    severity: RedFlagSeverity;
    phantomCredits: number;
    economicImpact: string;
    keyTargetsCount: number;
  };

  /**
   * Processing details
   */
  processingDetails?: {
    comparisonDataUsed: boolean;
    lcamDataUsed: boolean;
    personnelExtracted: number;
    findingsCount: number;
  };

  /**
   * Source data information
   */
  sourceStorage?: {
    comparisonAnalysisId?: string;
    lcamDocumentId?: string;
    generatedFrom: "environmental-red-flag-analysis";
  };
}>;

/**
 * Land use issue structure
 */
export type LandIssue = {
  issue: string;
  location: string;
  severity: string;
};

/**
 * Spatial analysis results structure
 */
export type SpatialAnalysis = {
  projectArea: [number, number, number, number];
  protectedArea: [number, number, number, number];
  projectAreaSize: number;
  protectedAreaSize: number;
  projectFeatureCount: number;
  protectedFeatureCount: number;
  hasOverlap: boolean;
  overlapArea: number;
  overlapPercentage: number;
};

/**
 * Environmental Red Flag 2 - Land Disputes and Unauthorized Land Use
 */
export type DataEnvironmentalRedFlag2 = BasePart<{
  /**
   * Comprehensive red flag narrative for land disputes and unauthorized use
   */
  redFlagNarrative: string;

  /**
   * Severity level based on land overlap and issues
   */
  severity: RedFlagSeverity;

  /**
   * Key spatial analysis findings
   */
  spatialFindings: string[];

  /**
   * Identified land use issues
   */
  landIssues: LandIssue[];

  /**
   * Areas requiring land certificate verification
   */
  verificationNeeded: string[];

  /**
   * Community partners and officials to investigate
   */
  investigationTargets: string[];
  recommendedActions: string[];

  /**
   * Spatial analysis results
   */
  spatialAnalysis: SpatialAnalysis;
  geojsonLayerId: string;

  /**
   * Generation timestamp
   */
  generatedAt: string;

  /**
   * Summary for quick overview
   */
  summary?: {
    projectName: string;
    severity: RedFlagSeverity;
    hasOverlap: boolean;
    overlapArea: number;
    landIssuesCount: number;
    verificationPointsCount: number;
  };

  /**
   * Processing details
   */
  processingDetails?: {
    projectGeojsonProcessed: boolean;
    protectedForestDataLoaded: boolean;
    overlapCalculationMethod: string;
    spatialFeaturesAnalyzed: number;
  };

  /**
   * Source data information
   */
  sourceStorage?: {
    projectGeojsonFile?: string;
    lcamDocumentId?: string;
    protectedForestSource?: string;
    generatedFrom: "spatial-overlap-analysis";
  };
}>;

/**
 * Financial Red Flag 1 - PEPs Analysis
 */
export type DataFinancialRedFlag1 = BasePart<{
  /**
   * Comprehensive red flag narrative in Indonesian
   */
  redFlagNarrative: string;

  /**
   * PEPs risk severity level
   */
  pepsSeverity: RedFlagSeverity;

  /**
   * Personnel with suspicious political connections
   */
  suspiciousPersonnel: Array<{
    name: string;
    role: string;
    riskLevel: string;
    findings: string;
  }>;

  /**
   * Priority areas for financial investigation
   */
  investigationPriorities: string[];

  /**
   * Assets requiring investigation
   */
  assetAnalysisNeeded: string[];

  /**
   * Whether international cooperation is needed
   */
  internationalCooperation: boolean;

  /**
   * Number of personnel analyzed
   */
  personnelAnalyzed: number;

  /**
   * Number of search results obtained
   */
  searchResults: number;

  /**
   * Generation timestamp
   */
  generatedAt: string;

  /**
   * Summary for quick overview
   */
  summary?: {
    projectName: string;
    pepsSeverity: RedFlagSeverity;
    suspiciousPersonnelCount: number;
    internationalCooperationNeeded: boolean;
    priorityInvestigationsCount: number;
  };

  /**
   * Processing details
   */
  processingDetails?: {
    webSearchesPerformed: number;
    searchSuccessRate: number;
    personnelWithFindings: number;
    averageSearchTime: number;
  };

  /**
   * Source data information
   */
  sourceStorage?: {
    lcamDocumentId?: string;
    personnelExtracted: number;
    generatedFrom: "peps-analysis";
  };
}>;

/**
 * Financial Red Flag 2 - Trading Patterns Analysis
 */
export type DataFinancialRedFlag2 = BasePart<{
  /**
   * Analysis methodology narrative (development mode)
   */
  methodologyNarrative: string;

  /**
   * Framework for trading pattern analysis
   */
  analysisFramework: string[];

  /**
   * Trading red flags to monitor
   */
  redFlagsToMonitor: string[];

  /**
   * Required data from SRN MENLHK
   */
  dataRequirements: string[];

  /**
   * Investigation steps when data is available
   */
  investigationSteps: string[];

  /**
   * Current development status
   */
  developmentStatus: string;

  /**
   * Development mode flag
   */
  developmentMode: boolean;

  /**
   * Generation timestamp
   */
  generatedAt: string;

  // When actual trading data becomes available, add these:
  /**
   * Actual red flag narrative (when trading data is available)
   */
  redFlagNarrative?: string;

  /**
   * Identified suspicious trading patterns
   */
  suspiciousPatterns?: Array<{
    pattern: string;
    frequency: number;
    riskLevel: RedFlagSeverity;
    description: string;
  }>;

  /**
   * Suspicious transactions identified
   */
  suspiciousTransactions?: Array<{
    transactionId: string;
    buyer: string;
    seller: string;
    amount: number;
    pricePerCredit: number;
    marketPrice: number;
    discrepancy: number;
    suspicionReason: string;
  }>;

  /**
   * Summary for quick overview
   */
  summary?: {
    projectName: string;
    developmentMode: boolean;
    frameworkElementsCount: number;
    redFlagsIdentified: number;
    dataRequirementsCount: number;
  };

  /**
   * Source data information
   */
  sourceStorage?: {
    lcamDocumentId?: string;
    tradingDataSource?: string; // When SRN MENLHK integration is ready
    generatedFrom: "trading-pattern-analysis";
  };
}>;

/**
 * Integrated Critical Findings - Comprehensive Analysis
 */
export type DataIntegratedCriticalFindings = BasePart<{
  /**
   * Executive summary of all critical findings
   */
  executiveSummary: string;

  /**
   * Comprehensive integrated critical findings narrative
   */
  integratedFindings: string;

  /**
   * Overall project risk level
   */
  overallRiskLevel: RedFlagSeverity;

  /**
   * Prioritized investigation actions
   */
  prioritizedActions: Array<{
    priority: string;
    action: string;
    timeline: string;
    responsible: string;
  }>;

  /**
   * Issues that span multiple red flags
   */
  crossCuttingIssues: string[];

  /**
   * Step-by-step investigation roadmap
   */
  investigationRoadmap: string[];

  /**
   * Required resources and expertise
   */
  resourceRequirements: string[];

  /**
   * Analysis inputs used
   */
  analysisInputs: {
    environmentalRedFlag1: boolean;
    environmentalRedFlag2: boolean;
    financialRedFlag1: boolean;
    financialRedFlag2: boolean;
    totalAnalyses: number;
  };

  /**
   * Generation timestamp
   */
  generatedAt: string;

  /**
   * Summary for quick overview
   */
  summary?: {
    projectName: string;
    overallRiskLevel: RedFlagSeverity;
    analysesIncluded: number;
    priorityActionsCount: number;
    crossCuttingIssuesCount: number;
    investigationStepsCount: number;
  };

  /**
   * Processing details
   */
  processingDetails?: {
    redFlagAnalysesIntegrated: string[];
    integrationMethod: string;
    riskCalculationMethod: string;
    totalFindingsConsidered: number;
  };

  /**
   * Source data information
   */
  sourceStorage?: {
    environmentalRedFlag1Id?: string;
    environmentalRedFlag2Id?: string;
    financialRedFlag1Id?: string;
    financialRedFlag2Id?: string;
    generatedFrom: "integrated-analysis";
  };
}>;
// Updated types untuk red flag analysis - tambahkan ini di types file kamu

/**
 * Red Flag Analysis Result - ini yang sebenarnya dikembalikan oleh findRedFlagAnalysis helper
 */
export type RedFlagAnalysisResult = {
  id: string;
  type: string;
  data: {
    state: "completed" | "in-progress" | "failed";
    name?: string;
    error?: string;

    // Environmental Red Flag 1 properties
    redFlagNarrative?: string | null;
    severity?: RedFlagSeverity | null;
    keyFindings?: string[] | null;
    investigationTargets?: InvestigationTarget[] | null;

    // Environmental Red Flag 2 properties
    spatialFindings?: string[];
    landIssues?: LandIssue[];
    spatialAnalysis?: SpatialAnalysis;

    // Financial Red Flag 1 properties
    pepsSeverity?: RedFlagSeverity;
    suspiciousPersonnel?: Array<{
      name: string;
      role: string;
      riskLevel: string;
      findings: string;
    }>;

    // Financial Red Flag 2 properties
    methodologyNarrative?: string;
    developmentStatus?: string;
    developmentMode?: boolean;

    // Integrated findings properties
    integratedFindings?: string;
    executiveSummary?: string;
    overallRiskLevel?: RedFlagSeverity;

    // Common properties
    generatedAt?: string;
    summary?: any;
  };
} | null;

/**
 * Individual Red Flags structure yang sebenarnya digunakan
 */
export type IndividualRedFlags = {
  environmentalRedFlag1: RedFlagAnalysisResult;
  environmentalRedFlag2: RedFlagAnalysisResult;
  financialRedFlag1: RedFlagAnalysisResult;
  financialRedFlag2: RedFlagAnalysisResult;
};
/**
 * NEW: Red Flag specific types
 */
export type RedFlagType =
  | "environmental-red-flag-1"
  | "environmental-red-flag-2"
  | "financial-red-flag-1"
  | "financial-red-flag-2"
  | "integrated-critical-findings";

export type RedFlagData =
  | DataEnvironmentalRedFlag1
  | DataEnvironmentalRedFlag2
  | DataFinancialRedFlag1
  | DataFinancialRedFlag2
  | DataIntegratedCriticalFindings;

/**
 * NEW: Personnel information structure
 */
export type Personnel = {
  name: string;
  role: string;
  contact?: string;
};

/**
 * NEW: Search result structure for PEPs analysis
 */
export type SearchResult = {
  person: Personnel;
  searchResult: any; // Web search result
  query: string;
  error?: string;
};

/**
 * NEW: Red flag summary for reporting
 */
export type RedFlagSummary = {
  totalAnalyses: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  overallRisk: RedFlagSeverity;
  analysisTypes: RedFlagType[];
};

/**
 * NEW: Tool response structure for red flags
 */
export type RedFlagToolResponse = {
  success: boolean;
  message: string;
  redFlagId?: string;
  criticalFindingsId?: string;
  summary: any;
};
