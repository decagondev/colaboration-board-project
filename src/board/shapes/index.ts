/**
 * Shapes Module
 *
 * Exports shape-related types, interfaces, and the registry.
 */

export type {
  ShapeType,
  ShapeCategory,
  ShapeRenderProps,
  ShapeDefaultSize,
  ShapeDefinition,
  ShapeDefinitionMap,
} from './ShapeDefinition';

export { ShapeRegistry } from './ShapeRegistry';
export type { IShapeRegistry } from './ShapeRegistry';

export {
  registerFlowchartShapes,
  registerBasicShapes,
  registerAllShapes,
  flowchartShapeDefinitions,
  basicShapeDefinitions,
  allShapeDefinitions,
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
  rectangleDefinition,
  ellipseDefinition,
  triangleDefinition,
  lineDefinition,
} from './renderers';
