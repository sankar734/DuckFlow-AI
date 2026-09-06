/**
 * OOXML Unit Conversions Utility
 * Standardizes conversions across Word/Excel/PowerPoint measurements
 */
export class UnitConversions {
  /**
   * Twips (twentieths of a point) to Points (pt)
   * 1 pt = 20 twips (standard for w:sz, w:spacing, w:pgMar, w:pgSz)
   */
  static twipsToPoints(twips: number): number {
    return twips / 20;
  }

  /**
   * Half-points (w:sz, w:szCs) to Points (pt)
   * 1 pt = 2 half-points (e.g., 24 half-points = 12 pt)
   */
  static halfPointsToPoints(halfPoints: number): number {
    return halfPoints / 2;
  }

  /**
   * EMUs (English Metric Units) to Points (pt)
   * 1 inch = 72 pt = 914,400 EMUs -> 1 pt = 12,700 EMUs
   */
  static emusToPoints(emus: number): number {
    return emus / 12700;
  }

  /**
   * EMUs to Pixels (px at 96 DPI)
   * 1 inch = 96 px = 914,400 EMUs -> 1 px = 9,525 EMUs
   */
  static emusToPixels(emus: number): number {
    return emus / 9525;
  }

  /**
   * Points to Pixels (at 96 DPI)
   * 1 pt = 96 / 72 px = 1.3333 px
   */
  static pointsToPixels(pt: number): number {
    return (pt * 96) / 72;
  }

  /**
   * Pixels to Points
   */
  static pixelsToPoints(px: number): number {
    return (px * 72) / 96;
  }

  /**
   * Inches to Points (pt)
   * 1 in = 72 pt
   */
  static inchesToPoints(inches: number): number {
    return inches * 72;
  }

  /**
   * Centimeters to Points (pt)
   * 1 cm = 72 / 2.54 pt ≈ 28.3465 pt
   */
  static cmToPoints(cm: number): number {
    return (cm * 72) / 2.54;
  }

  /**
   * OOXML Line Spacing (w:spacing w:line="...") to Multiplier
   * Default 240 = 1.0 (single), 276 = 1.15, 360 = 1.5, 480 = 2.0 (double)
   */
  static ooxmlLineSpacingToMultiplier(lineValue: number, lineRule: string = 'auto'): number {
    if (lineRule === 'exact' || lineRule === 'atLeast') {
      return this.twipsToPoints(lineValue) / 12;
    }
    return Math.max(0.8, Math.min(3.0, lineValue / 240));
  }
}
