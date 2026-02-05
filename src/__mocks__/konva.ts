/**
 * Konva Mock for Jest Testing
 *
 * Provides mock implementations of Konva classes and types
 * for testing purposes.
 */

export const Konva = {
  isBrowser: true,
  isDragging: () => false,
  isDragReady: () => false,
  getAngle: (angle: number) => angle,
  _injectGlobal: () => undefined,
};

export class Stage {
  attrs: Record<string, unknown> = {};
  children: unknown[] = [];

  constructor(config: Record<string, unknown>) {
    this.attrs = config;
  }

  add(): this {
    return this;
  }
  
  draw(): this {
    return this;
  }
  
  destroy(): void {
    return;
  }

  getPointerPosition(): { x: number; y: number } | null {
    return { x: 0, y: 0 };
  }
}

export class Layer {
  attrs: Record<string, unknown> = {};
  children: unknown[] = [];

  add(): this {
    return this;
  }
  
  draw(): this {
    return this;
  }
}

export class Group {
  attrs: Record<string, unknown> = {};
  children: unknown[] = [];

  add(): this {
    return this;
  }
}

export class Rect {
  attrs: Record<string, unknown> = {};
}

export class Circle {
  attrs: Record<string, unknown> = {};
}

export class Line {
  attrs: Record<string, unknown> = {};
}

export class Text {
  attrs: Record<string, unknown> = {};
}

export class Transformer {
  attrs: Record<string, unknown> = {};
  
  nodes(): void {
    return;
  }
  
  getLayer(): Layer | null {
    return null;
  }
}

export class Node {
  attrs: Record<string, unknown> = {};
  
  x(): number {
    return 0;
  }
  
  y(): number {
    return 0;
  }
  
  width(): number {
    return 100;
  }
  
  height(): number {
    return 100;
  }
}

export default Konva;
