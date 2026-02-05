/**
 * React-Konva Mock for Jest Testing
 *
 * Provides mock implementations of react-konva components
 * that return simple React elements for testing purposes.
 */

import * as React from 'react';

type MockComponentProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

/**
 * Creates a mock Konva component that renders a div with given props.
 */
function createMockComponent(name: string): React.FC<MockComponentProps> {
  const MockComponent: React.FC<MockComponentProps> = ({ children, ...props }) => {
    return React.createElement(
      'div',
      { 'data-testid': `mock-${name.toLowerCase()}`, ...props },
      children
    );
  };
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
}

export const Stage = createMockComponent('Stage');
export const Layer = createMockComponent('Layer');
export const Group = createMockComponent('Group');
export const Rect = createMockComponent('Rect');
export const Circle = createMockComponent('Circle');
export const Ellipse = createMockComponent('Ellipse');
export const Line = createMockComponent('Line');
export const Text = createMockComponent('Text');
export const Path = createMockComponent('Path');
export const Image = createMockComponent('Image');
export const Arrow = createMockComponent('Arrow');
export const Transformer = createMockComponent('Transformer');
export const Shape = createMockComponent('Shape');
