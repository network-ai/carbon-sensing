// utils/tiffLoader.ts
import { fromArrayBuffer } from "geotiff";

export interface TiffData {
  width: number;
  height: number;
  data: Float32Array | Uint8Array;
  bbox: number[]; // [west, south, east, north]
  noDataValue?: number | null;
}

export async function loadTiffFromPublic(filename: string): Promise<TiffData> {
  try {
    // Load TIFF from public folder
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "http://localhost:3000"; // fallback for server-side

    const response = await fetch(`${baseUrl}/${filename}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const tiff = await fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    // Get image data
    const rasters = await image.readRasters();
    const data = rasters[0] as Float32Array | Uint8Array;

    // Get geospatial information
    const bbox = image.getBoundingBox();
    const width = image.getWidth();
    const height = image.getHeight();

    // Get no data value if available
    const noDataValue = image.getGDALNoData();

    return {
      width,
      height,
      data,
      bbox,
      noDataValue,
    };
  } catch (error) {
    console.error("Error loading TIFF:", error);
    throw error;
  }
}

// Convert TIFF data to ImageData for canvas rendering
export function tiffToImageData(
  tiffData: TiffData,
  colorMap?: (value: number) => [number, number, number, number],
): ImageData {
  const { width, height, data, noDataValue } = tiffData;
  const imageData = new ImageData(width, height);

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    const pixelIndex = i * 4;

    if (noDataValue !== undefined && value === noDataValue) {
      // Transparent for no data
      imageData.data[pixelIndex] = 0; // R
      imageData.data[pixelIndex + 1] = 0; // G
      imageData.data[pixelIndex + 2] = 0; // B
      imageData.data[pixelIndex + 3] = 0; // A
    } else if (colorMap) {
      const [r, g, b, a] = colorMap(value);
      imageData.data[pixelIndex] = r;
      imageData.data[pixelIndex + 1] = g;
      imageData.data[pixelIndex + 2] = b;
      imageData.data[pixelIndex + 3] = a;
    } else {
      // Default grayscale mapping
      const normalized = Math.max(0, Math.min(255, value));
      imageData.data[pixelIndex] = normalized;
      imageData.data[pixelIndex + 1] = normalized;
      imageData.data[pixelIndex + 2] = normalized;
      imageData.data[pixelIndex + 3] = 255;
    }
  }

  return imageData;
}
