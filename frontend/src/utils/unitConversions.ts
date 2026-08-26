/**
 * DocuFlow AI — Centralized Unit Conversion System
 * 
 * Accurately converts between OOXML units and standard display/print units:
 * - Twips (twip / dxa): 1/20th of a point (1 inch = 1440 twips, 1 pt = 20 twips)
 * - Half-Points (hp): 1/2 of a point (e.g. <w:sz w:val="24"/> = 12 pt)
 * - EMU (English Metric Units): 1 inch = 914,400 EMUs, 1 cm = 360,000 EMUs, 1 pt = 12,700 EMUs
 * - Points (pt): Standard typographic point (1/72 inch)
 * - Pixels (px): Standard screen pixels at 96 DPI (1 pt = 96/72 px = 1.33333 px)
 * - Inches (in) & Centimeters (cm)
 */

export const UnitConversions = {
  // DPI Standard
  DPI: 96,
  POINTS_PER_INCH: 72,
  TWIPS_PER_INCH: 1440,
  TWIPS_PER_POINT: 20,
  EMUS_PER_INCH: 914400,
  EMUS_PER_CM: 360000,
  EMUS_PER_POINT: 12700,

  /**
   * Twips (DXA) -> Points
   */
  twipsToPoints(twips: number): number {
    if (!twips || isNaN(twips)) return 0;
    return twips / 20;
  },

  /**
   * Twips (DXA) -> Pixels (at 96 DPI)
   */
  twipsToPixels(twips: number): number {
    if (!twips || isNaN(twips)) return 0;
    return (twips / 1440) * 96;
  },

  /**
   * Half-Points -> Points (Used in <w:sz w:val="24"/> for 12pt)
   */
  halfPointsToPoints(hp: number): number {
    if (!hp || isNaN(hp)) return 11;
    return hp / 2;
  },

  /**
   * Half-Points -> Pixels
   */
  halfPointsToPixels(hp: number): number {
    const pt = UnitConversions.halfPointsToPoints(hp);
    return UnitConversions.pointsToPixels(pt);
  },

  /**
   * Points -> Pixels
   */
  pointsToPixels(pt: number): number {
    if (!pt || isNaN(pt)) return 0;
    return (pt * 96) / 72;
  },

  /**
   * Pixels -> Points
   */
  pixelsToPoints(px: number): number {
    if (!px || isNaN(px)) return 0;
    return (px * 72) / 96;
  },

  /**
   * EMUs -> Points
   */
  emusToPoints(emus: number): number {
    if (!emus || isNaN(emus)) return 0;
    return emus / 12700;
  },

  /**
   * EMUs -> Pixels (at 96 DPI)
   */
  emusToPixels(emus: number): number {
    if (!emus || isNaN(emus)) return 0;
    return (emus / 914400) * 96;
  },

  /**
   * Inches -> Points
   */
  inchesToPoints(inches: number): number {
    if (!inches || isNaN(inches)) return 0;
    return inches * 72;
  },

  /**
   * Inches -> Pixels
   */
  inchesToPixels(inches: number): number {
    if (!inches || isNaN(inches)) return 0;
    return inches * 96;
  },

  /**
   * Centimeters -> Points
   */
  cmToPoints(cm: number): number {
    if (!cm || isNaN(cm)) return 0;
    return (cm / 2.54) * 72;
  },

  /**
   * Centimeters -> Pixels
   */
  cmToPixels(cm: number): number {
    if (!cm || isNaN(cm)) return 0;
    return (cm / 2.54) * 96;
  },

  /**
   * Converts a line-height rule in OOXML to CSS line-height multiplier.
   * In OOXML:
   * - line="240" with lineRule="auto" = 1.0 (240/240)
   * - line="276" with lineRule="auto" = 1.15
   * - line="360" with lineRule="auto" = 1.5
   * - line="480" with lineRule="auto" = 2.0
   * - lineRule="exact" or "atLeast" = line value in twips
   */
  ooxmlLineSpacingToMultiplier(line?: number, lineRule?: string): number {
    if (!line || isNaN(line)) return 1.35; // clean modern default

    if (lineRule === 'exact' || lineRule === 'atLeast') {
      const pt = line / 20;
      return Math.max(1.0, pt / 12);
    }

    // Auto line rule (240 = single, 360 = 1.5, 480 = double)
    return Number((line / 240).toFixed(2));
  },
};
