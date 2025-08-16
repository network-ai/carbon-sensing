// upload-lcam-pdf.ts (Cleaned)
import type { CreateToolsContext } from "@/ai";
import { documentParseModel } from "@/ai/provider";
import { getPDF } from "@/lib/pdf-store";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";
import {
  countExtractedFields,
  generateContentPreview,
} from "./carbon-analyze-helper";

// 1. RINGKASAN EKSEKUTIF SCHEMA
const ringkasanEksekutifSchema = z.object({
  ringkasan_eksekutif: z
    .object({
      judul_kegiatan_aksi_mitigasi: z
        .string()
        .optional()
        .describe("Title of mitigation action activity"),
      tujuan_dan_lingkup_verifikasi: z
        .string()
        .optional()
        .describe("Purpose and scope of verification"),
      periode_laporan_pemantauan: z
        .string()
        .optional()
        .describe("Monitoring report period"),
      versi_laporan: z.string().optional().describe("Report version"),
      tanggal_laporan: z.string().optional().describe("Report date"),
      jenis_grk: z
        .array(z.string())
        .optional()
        .describe("Types of GHG calculated"),
      periode_penaatan: z.string().optional().describe("Crediting period"),
      total_area: z.string().optional().describe("Total project area"),
      area_bervegetasi: z.string().optional().describe("Vegetated area"),
    })
    .describe("Executive summary section"),
});

// 2. INFORMASI UMUM SCHEMA
const informasiUmumSchema = z.object({
  informasi_umum: z
    .object({
      judul_kegiatan: z.string().optional().describe("Activity title"),
      nomor_akun_srn_ppi: z
        .string()
        .optional()
        .describe("SRN PPI account number"),
      deskripsi_ringkas: z
        .string()
        .optional()
        .describe("Brief description of mitigation action"),

      komponen_konservasi: z
        .object({
          persentase_area: z
            .string()
            .optional()
            .describe("Percentage of conservation area"),
          perlindungan_area: z
            .string()
            .optional()
            .describe("Area protection details"),
          pencegahan_konversi: z
            .string()
            .optional()
            .describe("Conversion prevention measures"),
          pemeliharaan_carbon_stock: z
            .string()
            .optional()
            .describe("Carbon stock maintenance"),
        })
        .optional()
        .describe("Conservation component details"),

      komponen_restorasi: z
        .object({
          persentase_area: z
            .string()
            .optional()
            .describe("Percentage of restoration area"),
          restorasi_area_terdegradasi: z
            .string()
            .optional()
            .describe("Degraded area restoration"),
          peningkatan_kualitas_hutan: z
            .string()
            .optional()
            .describe("Forest quality improvement"),
          rehabilitasi_lahan_terbuka: z
            .string()
            .optional()
            .describe("Open land rehabilitation"),
          penanaman_bibit: z
            .string()
            .optional()
            .describe("Seedling planting activities"),
        })
        .optional()
        .describe("Restoration component details"),

      target_mitigasi: z
        .object({
          net_carbon_benefit: z
            .string()
            .optional()
            .describe("Net carbon benefit target"),
          durasi_tahun: z.string().optional().describe("Duration in years"),
          rata_rata_tahunan: z
            .string()
            .optional()
            .describe("Annual average target"),
          enhancement_restorasi: z
            .string()
            .optional()
            .describe("Restoration enhancement target"),
        })
        .optional()
        .describe("Mitigation targets"),

      tujuan_umum_dan_khusus: z
        .string()
        .optional()
        .describe("General and specific objectives"),

      alamat_dan_lokasi: z
        .object({
          lokasi_tapak: z.string().optional().describe("Project site location"),
          latitude: z.string().optional().describe("Latitude coordinates"),
          longitude: z.string().optional().describe("Longitude coordinates"),
          wilayah_administratif: z
            .array(z.string())
            .optional()
            .describe("Administrative regions"),
        })
        .optional()
        .describe("Address and location details"),

      pemilik_kegiatan: z
        .object({
          project_owner: z
            .string()
            .optional()
            .describe("Project owner organization"),
          technical_partner: z
            .string()
            .optional()
            .describe("Technical partner"),
          community_partner: z
            .string()
            .optional()
            .describe("Community partner"),
        })
        .optional()
        .describe("Activity owner organizations"),

      narahubung: z
        .object({
          narahubung_utama: z
            .object({
              nama_lengkap: z
                .string()
                .optional()
                .describe("Full name of primary contact"),
              jabatan: z.string().optional().describe("Position/title"),
              email: z.string().optional().describe("Email address"),
              no_telepon: z.string().optional().describe("Phone number"),
            })
            .optional()
            .describe("Primary contact person"),
          narahubung_teknis: z
            .object({
              nama_lengkap: z
                .string()
                .optional()
                .describe("Full name of technical contact"),
              jabatan: z.string().optional().describe("Position/title"),
              email: z.string().optional().describe("Email address"),
              no_telepon: z.string().optional().describe("Phone number"),
            })
            .optional()
            .describe("Technical contact person"),
        })
        .optional()
        .describe("Contact persons details"),

      metodologi_perhitungan: z
        .string()
        .optional()
        .describe("GHG calculation methodology used"),
    })
    .describe("General information section"),
});

// 3. LEMBAGA VERIFIKASI SCHEMA
const lembagaVerifikasiSchema = z.object({
  lembaga_verifikasi: z
    .object({
      identitas_lembaga: z
        .object({
          nama_lembaga: z
            .string()
            .optional()
            .describe("Verification body name"),
          akreditasi_indonesia: z
            .string()
            .optional()
            .describe("Indonesia accreditation"),
          masa_berlaku: z.string().optional().describe("Validity period"),
          pemberi_akreditasi: z
            .string()
            .optional()
            .describe("Accreditation provider"),
          amandemen: z.string().optional().describe("Amendment details"),
          perluasan_ruang_lingkup: z
            .string()
            .optional()
            .describe("Scope expansion"),
        })
        .optional()
        .describe("Verification body identity"),

      alamat_lembaga: z
        .object({
          nama_perusahaan: z.string().optional().describe("Company name"),
          alamat: z.string().optional().describe("Address"),
          email: z.string().optional().describe("Email address"),
          no_telepon: z.string().optional().describe("Phone number"),
          website: z.string().optional().describe("Website URL"),
        })
        .optional()
        .describe("Verification body address"),

      manajemen_penanggung_jawab: z
        .object({
          nama: z
            .string()
            .optional()
            .describe("Management responsible person name"),
          jabatan: z.string().optional().describe("Position/title"),
        })
        .optional()
        .describe("Management responsible person"),

      ketua_tim_verifikator: z
        .object({
          nama: z.string().optional().describe("Lead verifier name"),
          kompetensi: z
            .string()
            .optional()
            .describe("Lead verifier competencies and CV"),
          tugas_tanggung_jawab: z
            .string()
            .optional()
            .describe("Lead verifier duties and responsibilities"),
          sertifikasi: z
            .array(z.string())
            .optional()
            .describe("Certifications held"),
        })
        .optional()
        .describe("Lead verifier details"),

      verifikator_senior: z
        .object({
          nama: z.string().optional().describe("Senior verifier name"),
          spesialisasi: z.string().optional().describe("Specialization area"),
          kompetensi: z
            .string()
            .optional()
            .describe("Senior verifier competencies and CV"),
          tugas_tanggung_jawab: z
            .string()
            .optional()
            .describe("Senior verifier duties and responsibilities"),
          sertifikasi: z
            .array(z.string())
            .optional()
            .describe("Certifications held"),
        })
        .optional()
        .describe("Senior verifier details"),

      verifikator_spesialis: z
        .object({
          nama: z.string().optional().describe("Specialist verifier name"),
          spesialisasi: z.string().optional().describe("Specialization area"),
          kompetensi: z
            .string()
            .optional()
            .describe("Specialist verifier competencies and CV"),
          tugas_tanggung_jawab: z
            .string()
            .optional()
            .describe("Specialist verifier duties and responsibilities"),
          sertifikasi: z
            .array(z.string())
            .optional()
            .describe("Certifications held"),
        })
        .optional()
        .describe("Specialist verifier details"),

      tenaga_ahli: z.string().optional().describe("Expert team members"),

      peninjau_independen: z
        .object({
          nama: z.string().optional().describe("Independent reviewer name"),
          kompetensi: z
            .string()
            .optional()
            .describe("Independent reviewer competencies and background"),
          tugas_tanggung_jawab: z
            .string()
            .optional()
            .describe("Independent reviewer duties and responsibilities"),
          sertifikasi: z
            .array(z.string())
            .optional()
            .describe("Certifications held"),
        })
        .optional()
        .describe("Independent reviewer details"),
    })
    .describe("Verification body and team section"),
});

// 4. PERSONEL & KUNJUNGAN SCHEMA
const personelKunjunganSchema = z.object({
  personel_wawancara: z
    .array(
      z.object({
        no: z.number().optional().describe("Interview sequence number"),
        nama_interviewee: z.string().optional().describe("Interviewee name"),
        jabatan: z.string().optional().describe("Position/title"),
        organisasi: z.string().optional().describe("Organization"),
        topik_yang_dibahas: z.string().optional().describe("Topics discussed"),
        verifikator: z
          .string()
          .optional()
          .describe("Verifier conducting interview"),
      }),
    )
    .optional()
    .describe("List of interviewed personnel"),

  // kunjungan_tapak: z.object({
  //   tanggal_kunjungan: z.string().optional().describe("Site visit date"),
  //   lokasi_dikunjungi: z.array(z.string()).optional().describe("Locations visited"),
  //   kegiatan_dilakukan: z.array(z.string()).optional().describe("Activities conducted"),
  //   temuan_lapangan: z.string().optional().describe("Field findings")
  // }).optional().describe("Site visit details")
});

// 5. PENILAIAN LCAM SCHEMA
const penilaianLcamSchema = z.object({
  penilaian_lcam: z
    .object({
      ringkasan_kuantifikasi: z
        .object({
          periode_laporan: z
            .array(
              z.object({
                tahun: z
                  .number()
                  .optional()
                  .describe("Extract year from period coloms"),
                periode: z.string().optional().describe("Report period"),
                pengurangan_emisi_grk: z
                  .number()
                  .optional()
                  .describe("GHG emission reduction in tonCO2e"),
                emisi_baseline: z
                  .number()
                  .optional()
                  .describe("Baseline emissions in tonCO2e"),
                emisi_aksi_mitigasi: z
                  .number()
                  .optional()
                  .describe("Mitigation action emissions in tonCO2e"),
                kebocoran_leakage: z
                  .number()
                  .optional()
                  .describe("Leakage in tonCO2e"),
              }),
            )
            .optional()
            .describe("Annual monitoring report data"),
          total_kuantifikasi: z
            .object({
              pengurangan_emisi_grk: z
                .number()
                .optional()
                .describe("Total GHG emission reduction"),
              emisi_baseline: z
                .number()
                .optional()
                .describe("Total baseline emissions"),
              emisi_aksi_mitigasi: z
                .number()
                .optional()
                .describe("Total mitigation action emissions"),
              kebocoran_leakage: z
                .number()
                .optional()
                .describe("Total leakage"),
            })
            .optional()
            .describe("Total quantification for verified LCAM period"),
        })
        .optional()
        .describe("GHG emission reduction quantification summary"),

      perbandingan_dram_lcam: z
        .object({
          periode_perbandingan: z
            .array(
              z.object({
                tahun: z.number().optional().describe("Year"),
                periode: z.string().optional().describe("Report period"),
                dram: z
                  .number()
                  .optional()
                  .describe("DRAM emission reduction in tonCO2e"),
                lcam: z
                  .number()
                  .optional()
                  .describe("LCAM emission reduction in tonCO2e"),
                selisih: z
                  .number()
                  .optional()
                  .describe("Difference in tonCO2e"),
              }),
            )
            .optional()
            .describe("Annual comparison data"),
          total_perbedaan: z
            .object({
              dram: z.number().optional().describe("Total DRAM emissions"),
              lcam: z.number().optional().describe("Total LCAM emissions"),
              selisih: z.number().optional().describe("Total difference"),
            })
            .optional()
            .describe("Total difference between DRAM and LCAM"),
        })
        .optional()
        .describe("Comparison of DRAM and LCAM quantification results"),
    })
    .describe("LCAM assessment details"),
});

// 6. PROSES VERIFIKASI SCHEMA
const prosesVerifikasiSchema = z.object({
  proses_verifikasi: z
    .object({
      lingkup_verifikasi: z.string().optional().describe("Verification scope"),
      kriteria_verifikasi: z
        .array(z.string())
        .optional()
        .describe("Verification criteria"),
      tingkat_jaminan: z.string().optional().describe("Level of assurance"),
      ambang_materialitas: z
        .string()
        .optional()
        .describe("Materiality threshold"),
      metode_pelaksanaan: z
        .array(z.string())
        .optional()
        .describe("Implementation methods"),
      waktu_pelaksanaan: z
        .string()
        .optional()
        .describe("Implementation timeline"),
      standar_yang_digunakan: z
        .array(z.string())
        .optional()
        .describe("Standards used"),
    })
    .describe("Verification process summary"),
});
export const uploadLCAMPdf = (ctx: CreateToolsContext) =>
  tool({
    name: "upload-lcam-pdf",
    description:
      "Process PDF document for LCAM verification information extraction using section-by-section approach",
    inputSchema: z.object({
      fileName: z.string().describe("PDF file name to process"),
      sections: z
        .array(
          z.enum([
            "ringkasan_eksekutif",
            "informasi_umum",
            "lembaga_verifikasi",
            "personel_kunjungan",
            "penilaian_lcam",
          ]),
        )
        .optional()
        .nullable()
        .default([
          "ringkasan_eksekutif",
          "informasi_umum",
          "lembaga_verifikasi",
          "personel_kunjungan",
          "penilaian_lcam",
        ]),
    }),
    execute: async ({ fileName, sections }) => {
      const dataId = ulid();
      const processingId = `pdf-${dataId}`;

      ctx.writer.write({
        id: processingId,
        type: "data-document-lcam-processing",
        data: {
          name: `Processing PDF: ${fileName}`,
          state: "in-progress",
        },
      });

      try {
        // Get PDF base64 data
        const pdfBase64Data = getPDF(fileName);

        if (!pdfBase64Data) {
          throw new Error(
            `PDF data not found for file: ${fileName}. Please make sure the PDF was uploaded correctly.`,
          );
        }

        if (!validatePdfData(pdfBase64Data)) {
          throw new Error(
            "Invalid PDF file format - does not contain PDF signature",
          );
        }

        // Section configurations
        const sectionConfigs = {
          ringkasan_eksekutif: {
            schema: ringkasanEksekutifSchema,
            prompt:
              "Extract executive summary including project title, verification objectives, monitoring period, GHG types, and project area information.",
          },
          informasi_umum: {
            schema: informasiUmumSchema,
            prompt:
              "Extract general project information including project details, conservation/restoration components, mitigation targets, location, organizations, and contact information.",
          },
          lembaga_verifikasi: {
            schema: lembagaVerifikasiSchema,
            prompt:
              "Extract verification body information including identity, accreditation, address, management, and detailed team member information with their competencies.",
          },
          personel_kunjungan: {
            schema: personelKunjunganSchema,
            prompt:
              "Extract interviewed personnel list and site visit details including dates, locations, activities, and findings.",
          },
          penilaian_lcam: {
            schema: penilaianLcamSchema,
            prompt:
              "Extract LCAM assessment data including quantification results, emission reduction figures, baseline emissions, and DRAM vs LCAM comparisons.",
          },
        };

        // Extract data per section
        const extractedData: any = {};
        const sectionsToProcess = sections || [
          "ringkasan_eksekutif",
          "informasi_umum",
          "lembaga_verifikasi",
          "personel_kunjungan",
          "penilaian_lcam",
        ];

        for (const sectionName of sectionsToProcess) {
          const config = sectionConfigs[sectionName];
          if (config) {
            const sectionData = await extractSection(
              pdfBase64Data,
              fileName,
              sectionName,
              config.schema,
              config.prompt,
            );

            Object.assign(extractedData, sectionData);
          }
        }

        ctx.writer.write({
          id: processingId,
          type: "data-document-lcam-processing",
          data: {
            name: fileName,
            state: "completed",
            documentId: dataId,
            extractedData: extractedData,
            processingDetails: {
              extractionMethod: "section-by-section",
              fieldsExtracted: countExtractedFields(extractedData),
              timestamp: new Date().toISOString(),
            },
            documentMetadata: {
              fileName: fileName,
              fileSize: estimatePdfSize(pdfBase64Data),
              processingTime: Date.now(),
            },
            contentPreview: generateContentPreview(extractedData),
          },
        });

        return {
          success: true,
          message: `PDF "${fileName}" processed successfully using section-by-section extraction`,
          documentId: dataId,
          extractedData: extractedData,
          metrics: {
            extractionMethod: "section-by-section",
            sectionsProcessed: sectionsToProcess,
            fieldsExtracted: countExtractedFields(extractedData),
            timestamp: new Date().toISOString(),
            fileSize: estimatePdfSize(pdfBase64Data),
          },
          contentPreview: generateContentPreview(extractedData),
        };
      } catch (error) {
        ctx.writer.write({
          id: processingId,
          type: "data-document-lcam-processing",
          data: {
            name: `Error processing PDF: ${fileName}`,
            state: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to process PDF with section-by-section extraction",
          },
        });

        throw new Error(
          `Section-by-section PDF processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  });

// Helper functions
async function extractSection(
  pdfBase64Data: string,
  fileName: string,
  sectionName: string,
  schema: z.ZodType,
  sectionPrompt: string,
) {
  const result = await generateObject({
    model: documentParseModel,
    system: `You are a precise document extraction service specialized in LCAM verification documents.
    
    Focus ONLY on extracting the "${sectionName}" section from the PDF.
    ${sectionPrompt}
    
    Extract information precisely as it appears in the document. If information is not available, use "Not specified".`,
    schema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            mediaType: "application/pdf",
            data: pdfBase64Data,
          },
          {
            type: "text",
            text: `Extract ONLY the "${sectionName}" section from this LCAM verification PDF document "${fileName}". Focus specifically on this section and extract all relevant details.`,
          },
        ],
      },
    ],
  });

  return result.object;
}

function validatePdfData(pdfData: string): boolean {
  try {
    const decoded = atob(pdfData.substring(0, 100));
    return decoded.startsWith("%PDF");
  } catch {
    return false;
  }
}

function estimatePdfSize(base64Data: string): number {
  return Math.floor((base64Data.length * 3) / 4);
}
