/**
 * ILabelable Interface Unit Tests
 *
 * Tests for label utility functions and type guards.
 */

import {
  DEFAULT_LABEL_CONFIG,
  MIN_LABEL_FONT_SIZE,
  MAX_LABEL_FONT_SIZE,
  isLabelable,
  calculateFitFontSize,
  truncateText,
} from '../ILabelable';
import type { LabelConfig, ILabelable } from '../ILabelable';

describe('ILabelable Interface', () => {
  describe('DEFAULT_LABEL_CONFIG', () => {
    it('should have sensible default values', () => {
      expect(DEFAULT_LABEL_CONFIG.text).toBe('');
      expect(DEFAULT_LABEL_CONFIG.fontSize).toBe(14);
      expect(DEFAULT_LABEL_CONFIG.fontFamily).toBe('Arial, sans-serif');
      expect(DEFAULT_LABEL_CONFIG.fontWeight).toBe('normal');
      expect(DEFAULT_LABEL_CONFIG.color).toBe('#333333');
      expect(DEFAULT_LABEL_CONFIG.align).toBe('center');
      expect(DEFAULT_LABEL_CONFIG.verticalAlign).toBe('middle');
      expect(DEFAULT_LABEL_CONFIG.visible).toBe(true);
      expect(DEFAULT_LABEL_CONFIG.padding).toBe(8);
    });
  });

  describe('Font size constants', () => {
    it('should have valid min and max font sizes', () => {
      expect(MIN_LABEL_FONT_SIZE).toBe(8);
      expect(MAX_LABEL_FONT_SIZE).toBe(72);
      expect(MIN_LABEL_FONT_SIZE).toBeLessThan(MAX_LABEL_FONT_SIZE);
    });
  });

  describe('isLabelable type guard', () => {
    it('should return true for valid ILabelable objects', () => {
      const labelable: ILabelable = {
        label: { ...DEFAULT_LABEL_CONFIG },
        isLabelable: true,
        setLabelText: () => {},
        setLabelFontSize: () => {},
        setLabelColor: () => {},
        setLabelVisible: () => {},
        applyLabelConfig: () => {},
        getLabelDisplayText: () => '',
      };

      expect(isLabelable(labelable)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isLabelable(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isLabelable(undefined)).toBe(false);
    });

    it('should return false for objects without label property', () => {
      const obj = {
        isLabelable: true,
        setLabelText: () => {},
      };

      expect(isLabelable(obj)).toBe(false);
    });

    it('should return false for objects with isLabelable = false', () => {
      const obj = {
        label: { ...DEFAULT_LABEL_CONFIG },
        isLabelable: false,
        setLabelText: () => {},
      };

      expect(isLabelable(obj)).toBe(false);
    });

    it('should return false for objects without setLabelText method', () => {
      const obj = {
        label: { ...DEFAULT_LABEL_CONFIG },
        isLabelable: true,
      };

      expect(isLabelable(obj)).toBe(false);
    });
  });

  describe('calculateFitFontSize', () => {
    it('should return base font size when text fits', () => {
      const result = calculateFitFontSize('Hi', 200, 100, 14);
      expect(result).toBe(14);
    });

    it('should reduce font size for long text', () => {
      const result = calculateFitFontSize('This is a very long label text', 50, 20, 14);
      expect(result).toBeLessThan(14);
    });

    it('should not go below MIN_LABEL_FONT_SIZE', () => {
      const result = calculateFitFontSize('Very very very very long text', 10, 10, 14);
      expect(result).toBeGreaterThanOrEqual(MIN_LABEL_FONT_SIZE);
    });

    it('should not go above MAX_LABEL_FONT_SIZE', () => {
      const result = calculateFitFontSize('X', 1000, 1000, 100);
      expect(result).toBeLessThanOrEqual(MAX_LABEL_FONT_SIZE);
    });

    it('should handle empty text', () => {
      const result = calculateFitFontSize('', 100, 100, 14);
      expect(result).toBe(14);
    });
  });

  describe('truncateText', () => {
    it('should not truncate text that fits', () => {
      const result = truncateText('Hello', 100, 14);
      expect(result).toBe('Hello');
    });

    it('should truncate text with ellipsis when too long', () => {
      const result = truncateText('This is a very long label', 50, 14);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThan('This is a very long label'.length);
    });

    it('should not add ellipsis for very short max width', () => {
      const result = truncateText('Hello World', 5, 14);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty text', () => {
      const result = truncateText('', 100, 14);
      expect(result).toBe('');
    });

    it('should handle single character', () => {
      const result = truncateText('X', 100, 14);
      expect(result).toBe('X');
    });
  });
});

describe('LabelConfig Interface', () => {
  it('should allow creating valid label configs', () => {
    const config: LabelConfig = {
      text: 'Test Label',
      fontSize: 16,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#ff0000',
      align: 'left',
      verticalAlign: 'top',
      visible: true,
      padding: 10,
    };

    expect(config.text).toBe('Test Label');
    expect(config.fontSize).toBe(16);
    expect(config.fontFamily).toBe('Helvetica');
    expect(config.fontWeight).toBe('bold');
    expect(config.color).toBe('#ff0000');
    expect(config.align).toBe('left');
    expect(config.verticalAlign).toBe('top');
    expect(config.visible).toBe(true);
    expect(config.padding).toBe(10);
  });

  it('should support all horizontal alignment values', () => {
    const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
    
    for (const align of alignments) {
      const config: Partial<LabelConfig> = { align };
      expect(config.align).toBe(align);
    }
  });

  it('should support all vertical alignment values', () => {
    const alignments: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom'];
    
    for (const verticalAlign of alignments) {
      const config: Partial<LabelConfig> = { verticalAlign };
      expect(config.verticalAlign).toBe(verticalAlign);
    }
  });

  it('should support all font weight values', () => {
    const weights: Array<'normal' | 'bold'> = ['normal', 'bold'];
    
    for (const fontWeight of weights) {
      const config: Partial<LabelConfig> = { fontWeight };
      expect(config.fontWeight).toBe(fontWeight);
    }
  });
});
