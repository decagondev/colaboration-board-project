/**
 * Shape Renderers Module
 *
 * Exports all shape definitions and provides a function to register
 * them with the ShapeRegistry.
 */

import { ShapeRegistry } from '../ShapeRegistry';
import { diamondDefinition } from './DiamondRenderer';
import { parallelogramDefinition } from './ParallelogramRenderer';
import { cylinderDefinition } from './CylinderRenderer';
import { documentDefinition } from './DocumentRenderer';
import { processDefinition } from './ProcessRenderer';
import { terminatorDefinition } from './TerminatorRenderer';
import { delayDefinition } from './DelayRenderer';
import { manualInputDefinition } from './ManualInputRenderer';
import { displayDefinition } from './DisplayRenderer';
import { connectorShapeDefinition } from './ConnectorRenderer';
import {
  basicShapeDefinitions,
  rectangleDefinition as _rectangleDefinition,
  ellipseDefinition as _ellipseDefinition,
  triangleDefinition as _triangleDefinition,
  lineDefinition as _lineDefinition,
} from './BasicShapeDefinitions';
void _rectangleDefinition;
void _ellipseDefinition;
void _triangleDefinition;
void _lineDefinition;
import { umlClassDefinition } from './UmlClassRenderer';
import { umlActorDefinition } from './UmlActorRenderer';
import { umlInterfaceDefinition } from './UmlInterfaceRenderer';
import { umlPackageDefinition } from './UmlPackageRenderer';
import { umlComponentDefinition } from './UmlComponentRenderer';
import { umlStateDefinition } from './UmlStateRenderer';
import { umlLifelineDefinition } from './UmlLifelineRenderer';
import { umlNoteDefinition } from './UmlNoteRenderer';
import type { ShapeDefinition } from '../ShapeDefinition';

/**
 * All flowchart shape definitions.
 */
export const flowchartShapeDefinitions: ShapeDefinition[] = [
  diamondDefinition,
  parallelogramDefinition,
  cylinderDefinition,
  documentDefinition,
  processDefinition,
  terminatorDefinition,
  delayDefinition,
  manualInputDefinition,
  displayDefinition,
  connectorShapeDefinition,
];

/**
 * All UML shape definitions.
 */
export const umlShapeDefinitions: ShapeDefinition[] = [
  umlClassDefinition,
  umlActorDefinition,
  umlInterfaceDefinition,
  umlPackageDefinition,
  umlComponentDefinition,
  umlStateDefinition,
  umlLifelineDefinition,
  umlNoteDefinition,
];

/**
 * All shape definitions combined.
 */
export const allShapeDefinitions: ShapeDefinition[] = [
  ...basicShapeDefinitions,
  ...flowchartShapeDefinitions,
  ...umlShapeDefinitions,
];

/**
 * Registers all flowchart shapes with the ShapeRegistry.
 * Should be called during application initialization.
 */
export function registerFlowchartShapes(): void {
  for (const definition of flowchartShapeDefinitions) {
    if (!ShapeRegistry.has(definition.type)) {
      ShapeRegistry.register(definition);
    }
  }
}

/**
 * Registers basic shapes with the ShapeRegistry.
 * Should be called during application initialization.
 */
export function registerBasicShapes(): void {
  for (const definition of basicShapeDefinitions) {
    if (!ShapeRegistry.has(definition.type)) {
      ShapeRegistry.register(definition);
    }
  }
}

/**
 * Registers UML shapes with the ShapeRegistry.
 * Should be called during application initialization.
 */
export function registerUmlShapes(): void {
  for (const definition of umlShapeDefinitions) {
    if (!ShapeRegistry.has(definition.type)) {
      ShapeRegistry.register(definition);
    }
  }
}

/**
 * Registers all shapes (basic, flowchart, and UML) with the ShapeRegistry.
 * Should be called during application initialization.
 */
export function registerAllShapes(): void {
  registerBasicShapes();
  registerFlowchartShapes();
  registerUmlShapes();
}

export { diamondDefinition } from './DiamondRenderer';
export { parallelogramDefinition } from './ParallelogramRenderer';
export { cylinderDefinition } from './CylinderRenderer';
export { documentDefinition } from './DocumentRenderer';
export { processDefinition } from './ProcessRenderer';
export { terminatorDefinition } from './TerminatorRenderer';
export { delayDefinition } from './DelayRenderer';
export { manualInputDefinition } from './ManualInputRenderer';
export { displayDefinition } from './DisplayRenderer';
export { connectorShapeDefinition } from './ConnectorRenderer';
export {
  basicShapeDefinitions,
  rectangleDefinition,
  ellipseDefinition,
  triangleDefinition,
  lineDefinition,
} from './BasicShapeDefinitions';
export { umlClassDefinition } from './UmlClassRenderer';
export { umlActorDefinition } from './UmlActorRenderer';
export { umlInterfaceDefinition } from './UmlInterfaceRenderer';
export { umlPackageDefinition } from './UmlPackageRenderer';
export { umlComponentDefinition } from './UmlComponentRenderer';
export { umlStateDefinition } from './UmlStateRenderer';
export { umlLifelineDefinition } from './UmlLifelineRenderer';
export { umlNoteDefinition } from './UmlNoteRenderer';
