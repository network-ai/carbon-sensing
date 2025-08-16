import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/classnames";
import {
  AlertCircle,
  BarChart3,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Leaf,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Target,
  TreePine,
  User,
  Users,
} from "lucide-react";
import { type FC, useState } from "react";
import type { ToolPart } from ".";

// TypeScript type definition with all fields optional
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

  proses_verifikasi?: {
    lingkup_verifikasi?: string;
    kriteria_verifikasi?: string[];
    tingkat_jaminan?: string;
    ambang_materialitas?: string;
    metode_pelaksanaan?: string[];
    waktu_pelaksanaan?: string;
    standar_yang_digunakan?: string[];
  };
};

// Helper function untuk format tanggal
function formatDate(dateString?: string): string {
  if (!dateString) return "Not specified";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Helper function untuk format angka dengan pemisah ribuan
function formatNumber(num?: number): string {
  if (num === undefined || num === null) return "Not specified";
  return num.toLocaleString("id-ID");
}

// Helper function untuk safe string access
function safeString(value?: string | null): string {
  return value &&
    value.trim() &&
    value !== "Not specified" &&
    value !== "Not available"
    ? value
    : "Not specified";
}

// Helper function untuk safe array access
function safeArray<T>(arr?: T[] | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

// Helper function untuk menghitung completeness score yang lebih comprehensive
function calculateCompleteness(data?: LCAMDocument): {
  score: number;
  total: number;
  missing: string[];
} {
  if (!data) return { score: 0, total: 0, missing: [] };

  const requiredFields = [
    "ringkasan_eksekutif.judul_kegiatan_aksi_mitigasi",
    "ringkasan_eksekutif.tujuan_dan_lingkup_verifikasi",
    "ringkasan_eksekutif.periode_laporan_pemantauan",
    "informasi_umum.judul_kegiatan",
    "informasi_umum.deskripsi_ringkas",
    "informasi_umum.tujuan_umum_dan_khusus",
    "informasi_umum.alamat_dan_lokasi.lokasi_tapak",
    "informasi_umum.pemilik_kegiatan.project_owner",
    "informasi_umum.narahubung.narahubung_utama.nama_lengkap",
    "lembaga_verifikasi.identitas_lembaga.nama_lembaga",
    "lembaga_verifikasi.alamat_lembaga.nama_perusahaan",
    "lembaga_verifikasi.ketua_tim_verifikator.nama",
    "lembaga_verifikasi.verifikator_senior.nama",
    "lembaga_verifikasi.verifikator_spesialis.nama",
    "lembaga_verifikasi.peninjau_independen.nama",
    "proses_verifikasi.lingkup_verifikasi",
    "proses_verifikasi.tingkat_jaminan",
  ];

  const missing: string[] = [];
  let score = 0;

  requiredFields.forEach((field) => {
    const value = field.split(".").reduce((obj: any, key) => obj?.[key], data);
    if (
      value &&
      (typeof value === "string" ? value.trim() : value) &&
      value !== "Not specified" &&
      value !== "Not available"
    ) {
      score++;
    } else {
      missing.push(field);
    }
  });

  return { score, total: requiredFields.length, missing };
}

// Helper function untuk mendapatkan quality level
function getQualityLevel(completeness: number): {
  level: string;
  color: string;
  icon: any;
} {
  if (completeness >= 90)
    return {
      level: "Excellent",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle,
    };
  if (completeness >= 75)
    return {
      level: "Good",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: CheckCircle,
    };
  if (completeness >= 50)
    return {
      level: "Fair",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: AlertCircle,
    };
  return {
    level: "Poor",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  };
}

export const DocumentLCAM: FC<{
  part: ToolPart<"data-document-lcam-processing">;
  className?: string;
}> = ({ part, className }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(
    "ringkasan_eksekutif",
  );

  // State: In Progress
  if (part.data.state === "in-progress") {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex-1">
            <h4 className="font-medium">{part.data.name}</h4>
            <p className="text-sm text-muted-foreground">
              Extracting LCAM document content using AI...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State: Failed
  if (part.data.state === "failed") {
    return (
      <Card className={cn("p-4 border-destructive", className)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <h4 className="font-medium text-destructive">{part.data.name}</h4>
            <p className="text-sm text-muted-foreground">
              Error: {part.data.error || "Failed to process LCAM document"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State: Completed
  const { extractedData, processingDetails, documentMetadata } = part.data;
  const completeness = calculateCompleteness(extractedData as LCAMDocument);
  const completenessPercent = Math.round(
    (completeness.score / completeness.total) * 100,
  );
  const quality = getQualityLevel(completenessPercent);
  const QualityIcon = quality.icon;

  const sections = [
    {
      key: "ringkasan_eksekutif",
      name: "Ringkasan Eksekutif",
      icon: FileText,
      data: extractedData?.ringkasan_eksekutif,
    },
    {
      key: "informasi_umum",
      name: "Informasi Umum",
      icon: Building,
      data: extractedData?.informasi_umum,
    },
    {
      key: "lembaga_verifikasi",
      name: "Lembaga Verifikasi",
      icon: Shield,
      data: extractedData?.lembaga_verifikasi,
    },
    {
      key: "personel_wawancara",
      name: "Personel Wawancara",
      icon: MessageSquare,
      data: extractedData?.personel_wawancara,
    },
    {
      key: "kunjungan_tapak",
      name: "Kunjungan Tapak",
      icon: MapPin,
      data: extractedData?.kunjungan_tapak,
    },
    {
      key: "penilaian_lcam",
      name: "Penilaian LCAM",
      icon: BarChart3,
      data: extractedData?.penilaian_lcam,
    },
    // {
    //   key: 'proses_verifikasi',
    //   name: 'Proses Verifikasi',
    //   icon: Users,
    //   data: extractedData?.proses_verifikasi
    // }
  ];

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(extractedData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lcam-extracted-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSectionContent = (sectionKey: string, sectionData: any) => {
    if (!sectionData)
      return <p className="text-xs text-gray-500 italic">No data available</p>;

    switch (sectionKey) {
      case "ringkasan_eksekutif":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Informasi Utama
              </h6>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Judul Kegiatan:
                  </span>
                  <p className="text-sm mt-1">
                    {safeString(sectionData.judul_kegiatan_aksi_mitigasi)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Periode Laporan:
                  </span>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {safeString(sectionData.periode_laporan_pemantauan)}
                  </p>
                </div>
                {sectionData.jenis_grk &&
                  safeArray(sectionData.jenis_grk).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Jenis GRK:
                      </span>
                      <div className="flex gap-1 mt-1">
                        {/* {safeArray(sectionData.jenis_grk).map((grk: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{grk}</Badge>
                      ))} */}
                      </div>
                    </div>
                  )}
                {sectionData.total_area && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Total Area:
                      </span>
                      <p className="text-sm mt-1">
                        {safeString(sectionData.total_area)}
                      </p>
                    </div>
                    {sectionData.area_bervegetasi && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">
                          Area Bervegetasi:
                        </span>
                        <p className="text-sm mt-1">
                          {safeString(sectionData.area_bervegetasi)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h6 className="font-medium text-sm mb-3">
                Tujuan dan Lingkup Verifikasi
              </h6>
              <p className="text-xs leading-relaxed">
                {safeString(sectionData.tujuan_dan_lingkup_verifikasi)}
              </p>
            </div>
          </div>
        );

      case "informasi_umum":
        return (
          <div className="space-y-4">
            {/* Project Overview */}
            <div className="bg-white rounded-lg p-4 border">
              <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                <TreePine className="h-4 w-4 text-green-600" />
                Informasi Proyek
              </h6>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Judul Kegiatan:
                  </span>
                  <p className="text-sm mt-1">
                    {safeString(sectionData.judul_kegiatan)}
                  </p>
                </div>
                {sectionData.nomor_akun_srn_ppi && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Nomor Akun SRN PPI:
                    </span>
                    <p className="text-sm mt-1 font-mono">
                      {safeString(sectionData.nomor_akun_srn_ppi)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Deskripsi Ringkas:
                  </span>
                  <p className="text-xs mt-1 leading-relaxed">
                    {safeString(sectionData.deskripsi_ringkas)}
                  </p>
                </div>
              </div>
            </div>

            {/* Components */}
            {(sectionData.komponen_konservasi ||
              sectionData.komponen_restorasi) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionData.komponen_konservasi && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Komponen Konservasi
                    </h6>
                    <div className="space-y-2">
                      {Object.entries(sectionData.komponen_konservasi).map(
                        ([key, value]) => (
                          <div key={key}>
                            <span className="text-xs font-medium text-gray-600 capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <p className="text-xs mt-1">
                              {safeString(value as string)}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {sectionData.komponen_restorasi && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      Komponen Restorasi
                    </h6>
                    <div className="space-y-2">
                      {Object.entries(sectionData.komponen_restorasi).map(
                        ([key, value]) => (
                          <div key={key}>
                            <span className="text-xs font-medium text-gray-600 capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <p className="text-xs mt-1">
                              {safeString(value as string)}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Target Mitigasi */}
            {sectionData.target_mitigasi && (
              <div className="bg-white rounded-lg p-4 border">
                <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  Target Mitigasi
                </h6>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(sectionData.target_mitigasi).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span className="text-xs font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <p className="text-sm mt-1">
                          {safeString(value as string)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Location & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Lokasi
                </h6>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Lokasi Tapak:
                    </span>
                    <p className="text-xs mt-1">
                      {safeString(sectionData.alamat_dan_lokasi?.lokasi_tapak)}
                    </p>
                  </div>
                  {sectionData.alamat_dan_lokasi?.latitude && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-600">
                          Latitude:
                        </span>
                        <p className="text-xs mt-1 font-mono">
                          {safeString(sectionData.alamat_dan_lokasi.latitude)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-600">
                          Longitude:
                        </span>
                        <p className="text-xs mt-1 font-mono">
                          {safeString(sectionData.alamat_dan_lokasi.longitude)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  Kontak Utama
                </h6>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Nama:
                    </span>
                    <p className="text-sm mt-1">
                      {safeString(
                        sectionData.narahubung?.narahubung_utama?.nama_lengkap,
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Jabatan:
                    </span>
                    <p className="text-xs mt-1">
                      {safeString(
                        sectionData.narahubung?.narahubung_utama?.jabatan,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="text-xs">
                      {safeString(
                        sectionData.narahubung?.narahubung_utama?.email,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-xs">
                      {safeString(
                        sectionData.narahubung?.narahubung_utama?.no_telepon,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "penilaian_lcam":
        if (!sectionData || !sectionData.ringkasan_kuantifikasi) {
          return (
            <p className="text-xs text-gray-500 italic">
              No quantification data available
            </p>
          );
        }

        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs font-medium text-green-700">
                  Total Pengurangan
                </div>
                <div className="text-lg font-bold text-green-900">
                  {formatNumber(
                    sectionData.ringkasan_kuantifikasi.total_kuantifikasi
                      ?.pengurangan_emisi_grk,
                  )}
                </div>
                <div className="text-xs text-green-600">tCO₂e</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-medium text-blue-700">
                  Emisi Baseline
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {formatNumber(
                    sectionData.ringkasan_kuantifikasi.total_kuantifikasi
                      ?.emisi_baseline,
                  )}
                </div>
                <div className="text-xs text-blue-600">tCO₂e</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-xs font-medium text-orange-700">
                  Emisi Mitigasi
                </div>
                <div className="text-lg font-bold text-orange-900">
                  {formatNumber(
                    sectionData.ringkasan_kuantifikasi.total_kuantifikasi
                      ?.emisi_aksi_mitigasi,
                  )}
                </div>
                <div className="text-xs text-orange-600">tCO₂e</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-medium text-red-700">
                  Kebocoran
                </div>
                <div className="text-lg font-bold text-red-900">
                  {formatNumber(
                    sectionData.ringkasan_kuantifikasi.total_kuantifikasi
                      ?.kebocoran_leakage,
                  )}
                </div>
                <div className="text-xs text-red-600">tCO₂e</div>
              </div>
            </div>

            {/* Annual Data Table */}
            {sectionData.ringkasan_kuantifikasi.periode_laporan &&
              safeArray(sectionData.ringkasan_kuantifikasi.periode_laporan)
                .length > 0 && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 border-b">
                    <h6 className="font-medium text-sm">Data Tahunan</h6>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Tahun</th>
                          <th className="px-3 py-2 text-right">
                            Pengurangan (tCO₂e)
                          </th>
                          <th className="px-3 py-2 text-right">
                            Baseline (tCO₂e)
                          </th>
                          <th className="px-3 py-2 text-right">
                            Mitigasi (tCO₂e)
                          </th>
                          <th className="px-3 py-2 text-right">
                            Kebocoran (tCO₂e)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeArray(
                          sectionData.ringkasan_kuantifikasi.periode_laporan,
                        ).map((periode: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2 font-medium">
                              {periode.tahun || "N/A"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(periode.pengurangan_emisi_grk)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(periode.emisi_baseline)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(periode.emisi_aksi_mitigasi)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(periode.kebocoran_leakage)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* DRAM vs LCAM Comparison */}
            {sectionData.perbandingan_dram_lcam &&
              safeArray(sectionData.perbandingan_dram_lcam.periode_perbandingan)
                .length > 0 && (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 border-b">
                    <h6 className="font-medium text-sm">
                      Perbandingan DRAM vs LCAM
                    </h6>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Tahun</th>
                          <th className="px-3 py-2 text-right">DRAM (tCO₂e)</th>
                          <th className="px-3 py-2 text-right">LCAM (tCO₂e)</th>
                          <th className="px-3 py-2 text-right">
                            Selisih (tCO₂e)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeArray(
                          sectionData.perbandingan_dram_lcam
                            .periode_perbandingan,
                        ).map((periode: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2 font-medium">
                              {periode.tahun || "N/A"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(periode.dram)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(periode.lcam)}
                            </td>
                            <td className="px-3 py-2 text-right text-orange-600 font-medium">
                              {formatNumber(periode.selisih)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        );

      case "personel_wawancara":
        if (!Array.isArray(sectionData) || sectionData.length === 0) {
          return (
            <p className="text-xs text-gray-500 italic">
              No interview data available
            </p>
          );
        }

        return (
          <div className="space-y-3">
            {safeArray(sectionData).map((person: any, idx: number) => (
              <div key={idx} className="bg-white rounded-lg p-4 border">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h6 className="font-medium text-sm">
                          {safeString(person.nama_interviewee)}
                        </h6>
                        <p className="text-xs text-gray-600">
                          {safeString(person.jabatan)}
                        </p>
                        {person.organisasi && (
                          <p className="text-xs text-gray-500">
                            {safeString(person.organisasi)}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {safeString(person.verifikator)}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-medium text-gray-600">
                        Topik yang dibahas:
                      </span>
                      <p className="text-xs mt-1 leading-relaxed">
                        {safeString(person.topik_yang_dibahas)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "kunjungan_tapak":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Informasi Kunjungan
              </h6>
              <div className="space-y-3">
                {sectionData.tanggal_kunjungan && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Tanggal Kunjungan:
                    </span>
                    <p className="text-sm mt-1">
                      {safeString(sectionData.tanggal_kunjungan)}
                    </p>
                  </div>
                )}

                {sectionData.lokasi_dikunjungi &&
                  safeArray(sectionData.lokasi_dikunjungi).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Lokasi yang Dikunjungi:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {/* {safeArray(sectionData.lokasi_dikunjungi).map((lokasi: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {lokasi}
                        </Badge>
                      ))} */}
                      </div>
                    </div>
                  )}

                {sectionData.kegiatan_dilakukan &&
                  safeArray(sectionData.kegiatan_dilakukan).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Kegiatan yang Dilakukan:
                      </span>
                      <ul className="mt-1 space-y-1">
                        {/* {safeArray(sectionData.kegiatan_dilakukan).map((kegiatan: string, idx: number) => (
                        <li key={idx} className="text-xs flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {kegiatan}
                        </li>
                      ))} */}
                      </ul>
                    </div>
                  )}

                {sectionData.temuan_lapangan && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Temuan Lapangan:
                    </span>
                    <p className="text-xs mt-1 leading-relaxed bg-gray-50 p-2 rounded">
                      {safeString(sectionData.temuan_lapangan)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "lembaga_verifikasi":
        return (
          <div className="space-y-4">
            {/* Identitas Lembaga */}
            <div className="bg-white rounded-lg p-4 border">
              <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                Identitas Lembaga
              </h6>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Nama Lembaga:
                  </span>
                  <p className="text-sm mt-1">
                    {safeString(sectionData.identitas_lembaga?.nama_lembaga)}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sectionData.identitas_lembaga?.akreditasi_indonesia && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Akreditasi:
                      </span>
                      <p className="text-xs mt-1">
                        {safeString(
                          sectionData.identitas_lembaga.akreditasi_indonesia,
                        )}
                      </p>
                    </div>
                  )}
                  {sectionData.identitas_lembaga?.masa_berlaku && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Masa Berlaku:
                      </span>
                      <p className="text-xs mt-1">
                        {safeString(sectionData.identitas_lembaga.masa_berlaku)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alamat Lembaga */}
            <div className="bg-white rounded-lg p-4 border">
              <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                Alamat Lembaga
              </h6>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Alamat:
                  </span>
                  <p className="text-sm mt-1">
                    {safeString(sectionData.alamat_lembaga?.alamat)}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="text-xs">
                      {safeString(sectionData.alamat_lembaga?.email)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-xs">
                      {safeString(sectionData.alamat_lembaga?.no_telepon)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tim Verifikasi */}
            <div className="space-y-3">
              <h6 className="font-medium text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Tim Verifikasi
              </h6>

              {/* Ketua Tim */}
              {sectionData.ketua_tim_verifikator && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h6 className="font-medium text-sm">
                          {safeString(sectionData.ketua_tim_verifikator.nama)}
                        </h6>
                        <Badge className="text-xs">Ketua Tim</Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Kompetensi:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.ketua_tim_verifikator.kompetensi,
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Tugas & Tanggung Jawab:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.ketua_tim_verifikator
                                .tugas_tanggung_jawab,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verifikator Senior */}
              {sectionData.verifikator_senior && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h6 className="font-medium text-sm">
                          {safeString(sectionData.verifikator_senior.nama)}
                        </h6>
                        <Badge variant="outline" className="text-xs">
                          Verifikator Senior
                        </Badge>
                        {sectionData.verifikator_senior.spesialisasi && (
                          <Badge variant="secondary" className="text-xs">
                            {safeString(
                              sectionData.verifikator_senior.spesialisasi,
                            )}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Kompetensi:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.verifikator_senior.kompetensi,
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Tugas & Tanggung Jawab:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.verifikator_senior
                                .tugas_tanggung_jawab,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verifikator Spesialis */}
              {sectionData.verifikator_spesialis && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 rounded-full p-2">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h6 className="font-medium text-sm">
                          {safeString(sectionData.verifikator_spesialis.nama)}
                        </h6>
                        <Badge variant="outline" className="text-xs">
                          Verifikator Spesialis
                        </Badge>
                        {sectionData.verifikator_spesialis.spesialisasi && (
                          <Badge variant="secondary" className="text-xs">
                            {safeString(
                              sectionData.verifikator_spesialis.spesialisasi,
                            )}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Kompetensi:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.verifikator_spesialis.kompetensi,
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Tugas & Tanggung Jawab:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.verifikator_spesialis
                                .tugas_tanggung_jawab,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Peninjau Independen */}
              {sectionData.peninjau_independen && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h6 className="font-medium text-sm">
                          {safeString(sectionData.peninjau_independen.nama)}
                        </h6>
                        <Badge variant="outline" className="text-xs">
                          Peninjau Independen
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Kompetensi:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.peninjau_independen.kompetensi,
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            Tugas & Tanggung Jawab:
                          </span>
                          <p className="text-xs mt-1 leading-relaxed">
                            {safeString(
                              sectionData.peninjau_independen
                                .tugas_tanggung_jawab,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "proses_verifikasi":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Detail Proses Verifikasi
              </h6>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Lingkup Verifikasi:
                  </span>
                  <p className="text-xs mt-1 leading-relaxed">
                    {safeString(sectionData.lingkup_verifikasi)}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-600">
                    Tingkat Jaminan:
                  </span>
                  <p className="text-sm mt-1">
                    {safeString(sectionData.tingkat_jaminan)}
                  </p>
                </div>

                {sectionData.kriteria_verifikasi &&
                  safeArray(sectionData.kriteria_verifikasi).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Kriteria Verifikasi:
                      </span>
                      <ul className="mt-1 space-y-1">
                        {/* {safeArray(sectionData.kriteria_verifikasi).map((kriteria: string, idx: number) => (
                        <li key={idx} className="text-xs flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {kriteria}
                        </li>
                      ))} */}
                      </ul>
                    </div>
                  )}

                {sectionData.metode_pelaksanaan &&
                  safeArray(sectionData.metode_pelaksanaan).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Metode Pelaksanaan:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {/* {safeArray(sectionData.metode_pelaksanaan).map((metode: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">{metode}</Badge>
                      ))} */}
                      </div>
                    </div>
                  )}

                {sectionData.standar_yang_digunakan &&
                  safeArray(sectionData.standar_yang_digunakan).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Standar yang Digunakan:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {/* {safeArray(sectionData.standar_yang_digunakan).map((standar: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{standar}</Badge>
                      ))} */}
                      </div>
                    </div>
                  )}

                {sectionData.waktu_pelaksanaan && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Waktu Pelaksanaan:
                    </span>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {safeString(sectionData.waktu_pelaksanaan)}
                    </p>
                  </div>
                )}

                {sectionData.ambang_materialitas && (
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Ambang Materialitas:
                    </span>
                    <p className="text-sm mt-1">
                      {safeString(sectionData.ambang_materialitas)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {Object.entries(sectionData).map(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                return (
                  <div key={key} className="bg-white rounded p-3">
                    <h6 className="font-medium text-xs text-gray-700 mb-2 capitalize">
                      {key.replace(/_/g, " ")}
                    </h6>
                    <div className="space-y-1">
                      {Object.entries(value).map(([subKey, subValue]) => (
                        <div key={subKey} className="text-xs">
                          <span className="text-gray-600 capitalize">
                            {subKey.replace(/_/g, " ")}:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {safeString(subValue as string)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={key} className="bg-white rounded p-3">
                  <h6 className="font-medium text-xs text-gray-700 mb-1 capitalize">
                    {key.replace(/_/g, " ")}
                  </h6>
                  <p className="text-xs text-gray-900 leading-relaxed">
                    {safeString(value as string)}
                  </p>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{part.data.name}</h4>
            <Badge className={quality.color}>
              <QualityIcon className="h-3 w-3 mr-1" />
              {quality.level}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            LCAM Verification Document •{" "}
            {processingDetails?.fieldsExtracted || 0} fields extracted
          </p>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {completenessPercent}% Complete
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(processingDetails?.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {processingDetails?.extractionMethod || "N/A"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Eye className="h-3 w-3 mr-1" />
            {showDetails ? "Hide" : "View"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadJSON}>
            <Download className="h-3 w-3 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            const hasData =
              section.data &&
              (Array.isArray(section.data)
                ? section.data.length > 0
                : typeof section.data === "object"
                  ? Object.values(section.data).some(
                      (val) =>
                        val &&
                        (typeof val === "string"
                          ? val.trim() && val !== "Not specified"
                          : true),
                    )
                  : section.data);

            return (
              <div
                key={section.key}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  hasData
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200",
                  activeSection === section.key && "ring-2 ring-primary",
                )}
                onClick={() => setActiveSection(section.key)}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon
                    className={cn(
                      "h-4 w-4",
                      hasData ? "text-green-600" : "text-gray-400",
                    )}
                  />
                  <span className="text-xs font-medium">{section.name}</span>
                </div>
                <div
                  className={cn(
                    "text-xs mt-1",
                    hasData ? "text-green-700" : "text-gray-500",
                  )}
                >
                  {hasData ? "✓ Extracted" : "⚬ Limited"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t">
          <div className="space-y-4">
            {/* Section Navigation */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "flex-none px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                    activeSection === section.key
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  {section.name}
                </button>
              ))}
            </div>

            {/* Section Content */}
            <div className="bg-gray-50 rounded-lg p-4">
              {(() => {
                const currentSection = sections.find(
                  (s) => s.key === activeSection,
                );
                if (!currentSection) return null;

                return (
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      <currentSection.icon className="h-4 w-4" />
                      {currentSection.name}
                    </h5>

                    {renderSectionContent(activeSection, currentSection.data)}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Document ID: {part.data.documentId?.slice(-8) || "N/A"}</span>
            <span>Status: Processed</span>
            {documentMetadata?.fileName && (
              <span>File: {documentMetadata.fileName}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span>
              {completeness.score}/{completeness.total} fields
            </span>
            {completeness.missing.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {completeness.missing.length} missing
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
