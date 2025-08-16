// utils/carbonMappings.ts
export const LAYER_OPTIONS: Array<{
  id: LayerType;
  name: string;
  description: string;
}> = [
  {
    id: "carbon_stock",
    name: "Carbon Stock",
    description: "Total carbon storage (Mg C)",
  },
  {
    id: "forest_growth",
    name: "Forest Growth",
    description: "Growth compared to baseline (Mg C)",
  },
  {
    id: "net_sequestration",
    name: "Net Sequestration",
    description: "Net sequestration after leakage (Mg C)",
  },
  {
    id: "min_marketable",
    name: "Min Marketable Credits",
    description: "Minimum marketable carbon credits (IDR)",
  },
  {
    id: "max_marketable",
    name: "Max Marketable Credits",
    description: "Maximum marketable carbon credits (IDR)",
  },
];

export const CARBON_STOCK_MAP: Record<number, number> = {
  0: 16775.5, // Primary forest
  1: 13029, // Secondary forest
  2: 12395.5, // Plantation forest
  3: 18806, // Mangrove
  4: 6822.75, // Shrubland
  5: 4773.5, // Grassland
  6: 3243.25, // Agriculture
  7: 617.5, // Settlement
  8: 2849.25, // Bare land
  9: 2975, // Water body
  10: 7962.25, // Wetland
  11: 13320.25, // Mixed forest
  12: 3955.875, // Agroforestry
  13: 1959, // Mining
  14: 2975, // Aquaculture
  15: 1005, // Urban green
  16: 582.5, // Road
  17: 7450, // Other vegetation
};
export const LULC_LABELS: Record<number, string> = {
  0: "Primary Dryland Forest",
  1: "Secondary Dryland Forest",
  2: "Primary Mangrove Forest",
  3: "Primary Swamp Forest",
  4: "Plantation Forest",
  5: "Wet Shrub",
  6: "Estate Crop",
  7: "Settlement",
  8: "Bare Ground",
  9: "Open Water",
  10: "Secondary Mangrove Forest",
  11: "Secondary Swamp Forest",
  12: "Mixed Dry Agriculture",
  13: "Paddy Field",
  14: "Fish Pond",
  15: "Transmigration Areas",
  16: "Mining Areas",
  17: "Open Swamps",
};

export type LayerType =
  | "carbon_stock"
  | "forest_growth"
  | "net_sequestration"
  | "min_marketable"
  | "max_marketable";

export interface LayerConfig {
  id: LayerType;
  name: string;
  description: string;
  unit: string;
  colorMap: (value: number) => [number, number, number, number];
  legendItems: Array<{ value: number; color: string; label: string }>;
}

// Color mapping functions berdasarkan tipe layer
export const createCarbonStockColorMap = (
  value: number,
): [number, number, number, number] => {
  const carbonValue = CARBON_STOCK_MAP[value] || 0;

  // Gradient dari merah (rendah) ke hijau tua (tinggi)
  if (carbonValue === 0) return [200, 200, 200, 255]; // Abu-abu untuk no data

  const normalized = Math.min(carbonValue / 20000, 1); // Max 20000 Mg C
  const r = Math.round(255 * (1 - normalized));
  const g = Math.round(100 + 155 * normalized); // 100-255 range untuk hijau
  const b = 0;
  return [r, g, b, 255];
};
export const createForestGrowthColorMap =
  (baselineData: Record<string, number>) =>
  (value: number): [number, number, number, number] => {
    const currentCarbon = CARBON_STOCK_MAP[value] || 0;

    // If no baseline data, use current value as baseline (no growth)
    const baselineCarbon =
      Object.keys(baselineData).length > 0
        ? (baselineData[`${value}`] || 0) * (CARBON_STOCK_MAP[value] || 0)
        : currentCarbon;

    const growth = currentCarbon - baselineCarbon;

    if (Math.abs(growth) < 0.1) {
      // Very small change
      return [240, 240, 240, 255]; // Light gray for no significant change
    } else if (growth < 0) {
      // Red for loss
      const normalized = Math.min(Math.abs(growth) / 2000, 1);
      return [
        255,
        Math.round(100 * (1 - normalized)),
        Math.round(100 * (1 - normalized)),
        255,
      ];
    } else {
      // Green for growth
      if (growth > 0 && growth <= 500) {
        return [0, 255, 0, 255]; // Bright green
      } else if (growth > 500 && growth <= 1500) {
        return [50, 255, 50, 255]; // Medium green
      } else {
        return [0, 200, 0, 255]; // Dark green
      }
    }
  };
export const createForestGrowthColorMapOld =
  (baselineData: Record<string, number>) =>
  (value: number): [number, number, number, number] => {
    const currentCarbon = CARBON_STOCK_MAP[value] || 0;
    const baselineCarbon =
      baselineData[`${value}`] || CARBON_STOCK_MAP[value] || 0;
    const growth = currentCarbon - baselineCarbon;

    if (growth < 0) {
      // Merah terang untuk loss - lebih visible
      const normalized = Math.min(Math.abs(growth) / 2000, 1); // Threshold lebih rendah untuk sensitifitas
      return [
        255,
        Math.round(100 * (1 - normalized)),
        Math.round(100 * (1 - normalized)),
        255,
      ];
    } else if (growth === 0) {
      return [240, 240, 240, 255]; // Abu-abu terang untuk no change
    } else {
      // BRIGHT GREEN untuk growth positif - sangat highlight!
      const normalized = Math.min(growth / 1000, 1); // Threshold sangat rendah untuk highlight cepat
      if (growth > 0 && growth <= 500) {
        return [0, 255, 0, 255]; // Lime green terang untuk growth kecil
      } else if (growth > 500 && growth <= 1500) {
        return [50, 255, 50, 255]; // Bright green untuk growth sedang
      } else {
        return [0, 200, 0, 255]; // Forest green untuk growth tinggi
      }
    }
  };

export const createNetSequestrationColorMap =
  (baselineData: Record<string, number>) =>
  (value: number): [number, number, number, number] => {
    const currentCarbon = CARBON_STOCK_MAP[value] || 0;
    const baselineCarbon =
      baselineData[`${value}`] || CARBON_STOCK_MAP[value] || 0;
    const forestGrowth = currentCarbon - baselineCarbon;
    const leakage = forestGrowth * 0.1;
    const netSequestration = forestGrowth - leakage;

    if (netSequestration <= 0) {
      return [139, 69, 19, 255]; // Coklat untuk no sequestration
    } else {
      // CYAN/AQUA terang untuk sequestration positif - sangat kontras!
      if (netSequestration > 0 && netSequestration <= 800) {
        return [0, 255, 255, 255]; // Bright cyan untuk sequestration rendah
      } else if (netSequestration > 800 && netSequestration <= 2000) {
        return [0, 200, 255, 255]; // Sky blue untuk sequestration sedang
      } else {
        return [0, 150, 255, 255]; // Deep blue untuk sequestration tinggi
      }
    }
  };

export const createMinMarketableColorMap =
  (baselineData: Record<string, number>) =>
  (value: number): [number, number, number, number] => {
    const currentCarbon = CARBON_STOCK_MAP[value] || 0;
    const baselineCarbon =
      baselineData[`${value}`] || CARBON_STOCK_MAP[value] || 0;
    const forestGrowth = currentCarbon - baselineCarbon;
    const leakage = forestGrowth * 0.1;
    const netSequestration = forestGrowth - leakage;
    // FIXED: Langsung kalikan dengan 30,000 IDR per Mg C
    const minMarketableCredits =
      netSequestration > 0 ? netSequestration * 30000 : 0;

    if (minMarketableCredits === 0) {
      return [100, 100, 100, 255]; // Abu-abu gelap
    } else {
      // MAGENTA/PINK terang untuk marketable credits - sangat eye-catching!
      if (minMarketableCredits > 0 && minMarketableCredits <= 30000000) {
        // 0-30M IDR
        return [255, 0, 255, 255]; // Bright magenta
      } else if (
        minMarketableCredits > 30000000 &&
        minMarketableCredits <= 70000000
      ) {
        // 30M-70M IDR
        return [255, 100, 255, 255]; // Light magenta
      } else {
        return [200, 0, 200, 255]; // Deep magenta untuk nilai tinggi
      }
    }
  };

export const createMaxMarketableColorMap =
  (baselineData: Record<string, number>) =>
  (value: number): [number, number, number, number] => {
    const currentCarbon = CARBON_STOCK_MAP[value] || 0;
    const baselineCarbon =
      baselineData[`${value}`] || CARBON_STOCK_MAP[value] || 0;
    const forestGrowth = currentCarbon - baselineCarbon;
    const leakage = forestGrowth * 0.1;
    const netSequestration = forestGrowth - leakage;
    // FIXED: Langsung kalikan dengan 70,000 IDR per Mg C
    const maxMarketableCredits =
      netSequestration > 0 ? netSequestration * 70000 : 0;

    if (maxMarketableCredits === 0) {
      return [100, 100, 100, 255]; // Abu-abu gelap
    } else {
      // BRIGHT ORANGE/YELLOW untuk max marketable credits - sangat visible!
      if (maxMarketableCredits > 0 && maxMarketableCredits <= 70000000) {
        // 0-70M IDR
        return [255, 215, 0, 255]; // Bright gold
      } else if (
        maxMarketableCredits > 70000000 &&
        maxMarketableCredits <= 150000000
      ) {
        // 70M-150M IDR
        return [255, 165, 0, 255]; // Bright orange
      } else {
        return [255, 140, 0, 255]; // Dark orange untuk nilai tinggi
      }
    }
  };

// Dynamic legend generator
export const generateLegendItems = (
  layerType: LayerType,
  baselineData?: Record<string, number>,
) => {
  switch (layerType) {
    case "carbon_stock":
      return [
        { value: 0, color: "rgb(200, 200, 200)", label: "No Data (0 Mg C)" },
        { value: 1, color: "rgb(255, 100, 0)", label: "Low (< 5,000 Mg C)" },
        {
          value: 2,
          color: "rgb(200, 150, 0)",
          label: "Medium (5,000-10,000 Mg C)",
        },
        {
          value: 3,
          color: "rgb(150, 200, 0)",
          label: "High (10,000-15,000 Mg C)",
        },
        {
          value: 4,
          color: "rgb(0, 255, 0)",
          label: "Very High (> 15,000 Mg C)",
        },
      ];

    case "forest_growth":
      return [
        { value: -1, color: "rgb(255, 100, 100)", label: "Loss (< 0 Mg C)" },
        { value: 0, color: "rgb(240, 240, 240)", label: "No Change (0 Mg C)" },
        { value: 1, color: "rgb(0, 255, 0)", label: "Low Growth (0-500 Mg C)" },
        {
          value: 2,
          color: "rgb(50, 255, 50)",
          label: "Medium Growth (500-1,500 Mg C)",
        },
        {
          value: 3,
          color: "rgb(0, 200, 0)",
          label: "High Growth (> 1,500 Mg C)",
        },
      ];

    case "net_sequestration":
      return [
        {
          value: 0,
          color: "rgb(139, 69, 19)",
          label: "No Sequestration (≤ 0 Mg C)",
        },
        { value: 1, color: "rgb(0, 255, 255)", label: "Low (0-800 Mg C)" },
        {
          value: 2,
          color: "rgb(0, 200, 255)",
          label: "Medium (800-2,000 Mg C)",
        },
        { value: 3, color: "rgb(0, 150, 255)", label: "High (> 2,000 Mg C)" },
      ];

    case "min_marketable":
      return [
        { value: 0, color: "rgb(100, 100, 100)", label: "No Credits (IDR 0)" },
        { value: 1, color: "rgb(255, 0, 255)", label: "Low (IDR 0-30M)" },
        {
          value: 2,
          color: "rgb(255, 100, 255)",
          label: "Medium (IDR 30M-70M)",
        },
        { value: 3, color: "rgb(200, 0, 200)", label: "High (> IDR 70M)" },
      ];

    case "max_marketable":
      return [
        { value: 0, color: "rgb(100, 100, 100)", label: "No Credits (IDR 0)" },
        { value: 1, color: "rgb(255, 215, 0)", label: "Low (IDR 0-70M)" },
        { value: 2, color: "rgb(255, 165, 0)", label: "Medium (IDR 70M-150M)" },
        { value: 3, color: "rgb(255, 140, 0)", label: "High (> IDR 150M)" },
      ];

    default:
      return [];
  }
};
