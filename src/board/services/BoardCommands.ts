/**
 * Board Commands
 *
 * Concrete command implementations for board object operations.
 */

import type { ICommand, CommandType, IBatchCommand } from '../interfaces/ICommand';
import type { IBoardObject, Position, Size } from '../interfaces/IBoardObject';
import type { ColorScheme } from '../interfaces/IColorable';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Base command implementation with common functionality.
 */
abstract class BaseCommand implements ICommand {
  readonly id: string;
  abstract readonly type: CommandType;
  abstract readonly description: string;
  readonly timestamp: number;
  readonly executedBy: string;

  constructor(executedBy: string) {
    this.id = generateUUID();
    this.timestamp = Date.now();
    this.executedBy = executedBy;
  }

  abstract execute(): void;
  abstract undo(): void;
}

/**
 * Command for creating a new board object.
 */
export class CreateObjectCommand extends BaseCommand {
  readonly type: CommandType = 'create';
  readonly description: string;

  private _object: IBoardObject;
  private _addToBoard: (object: IBoardObject) => void;
  private _removeFromBoard: (objectId: string) => void;

  /**
   * Create a new CreateObjectCommand.
   *
   * @param object - The object to create
   * @param addToBoard - Function to add object to board
   * @param removeFromBoard - Function to remove object from board
   * @param executedBy - User executing the command
   */
  constructor(
    object: IBoardObject,
    addToBoard: (object: IBoardObject) => void,
    removeFromBoard: (objectId: string) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._object = object;
    this._addToBoard = addToBoard;
    this._removeFromBoard = removeFromBoard;
    this.description = `Create ${object.type}`;
  }

  execute(): void {
    this._addToBoard(this._object);
  }

  undo(): void {
    this._removeFromBoard(this._object.id);
  }
}

/**
 * Command for deleting board objects.
 */
export class DeleteObjectsCommand extends BaseCommand {
  readonly type: CommandType = 'delete';
  readonly description: string;

  private _objectIds: string[];
  private _objects: IBoardObject[];
  private _addToBoard: (object: IBoardObject) => void;
  private _removeFromBoard: (objectId: string) => void;

  /**
   * Create a new DeleteObjectsCommand.
   *
   * @param objects - The objects to delete
   * @param addToBoard - Function to add object to board
   * @param removeFromBoard - Function to remove object from board
   * @param executedBy - User executing the command
   */
  constructor(
    objects: IBoardObject[],
    addToBoard: (object: IBoardObject) => void,
    removeFromBoard: (objectId: string) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._objectIds = objects.map((obj) => obj.id);
    this._objects = objects.map((obj) => obj.clone());
    this._addToBoard = addToBoard;
    this._removeFromBoard = removeFromBoard;
    this.description =
      objects.length === 1
        ? `Delete ${objects[0].type}`
        : `Delete ${objects.length} objects`;
  }

  execute(): void {
    for (const id of this._objectIds) {
      this._removeFromBoard(id);
    }
  }

  undo(): void {
    for (const object of this._objects) {
      this._addToBoard(object);
    }
  }
}

/**
 * Command for moving board objects.
 */
export class MoveObjectsCommand extends BaseCommand {
  readonly type: CommandType = 'move';
  readonly description: string;

  private _objectIds: string[];
  private _oldPositions: Map<string, Position>;
  private _newPositions: Map<string, Position>;
  private _updatePosition: (objectId: string, position: Position) => void;

  /**
   * Create a new MoveObjectsCommand.
   *
   * @param objectIds - IDs of objects to move
   * @param oldPositions - Original positions
   * @param newPositions - New positions
   * @param updatePosition - Function to update object position
   * @param executedBy - User executing the command
   */
  constructor(
    objectIds: string[],
    oldPositions: Map<string, Position>,
    newPositions: Map<string, Position>,
    updatePosition: (objectId: string, position: Position) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._objectIds = objectIds;
    this._oldPositions = new Map(oldPositions);
    this._newPositions = new Map(newPositions);
    this._updatePosition = updatePosition;
    this.description =
      objectIds.length === 1 ? 'Move object' : `Move ${objectIds.length} objects`;
  }

  execute(): void {
    for (const id of this._objectIds) {
      const newPos = this._newPositions.get(id);
      if (newPos) {
        this._updatePosition(id, newPos);
      }
    }
  }

  undo(): void {
    for (const id of this._objectIds) {
      const oldPos = this._oldPositions.get(id);
      if (oldPos) {
        this._updatePosition(id, oldPos);
      }
    }
  }

  canMergeWith(other: ICommand): boolean {
    if (other.type !== 'move') return false;
    const otherMove = other as MoveObjectsCommand;
    if (this._objectIds.length !== otherMove._objectIds.length) return false;
    return this._objectIds.every((id) => otherMove._objectIds.includes(id));
  }

  mergeWith(other: ICommand): ICommand {
    const otherMove = other as MoveObjectsCommand;
    return new MoveObjectsCommand(
      this._objectIds,
      this._oldPositions,
      otherMove._newPositions,
      this._updatePosition,
      this.executedBy
    );
  }
}

/**
 * Command for resizing board objects.
 */
export class ResizeObjectCommand extends BaseCommand {
  readonly type: CommandType = 'resize';
  readonly description = 'Resize object';

  private _objectId: string;
  private _oldSize: Size;
  private _newSize: Size;
  private _oldPosition: Position;
  private _newPosition: Position;
  private _updateSize: (objectId: string, size: Size, position: Position) => void;

  /**
   * Create a new ResizeObjectCommand.
   *
   * @param objectId - ID of object to resize
   * @param oldSize - Original size
   * @param newSize - New size
   * @param oldPosition - Original position
   * @param newPosition - New position (may change during resize)
   * @param updateSize - Function to update object size
   * @param executedBy - User executing the command
   */
  constructor(
    objectId: string,
    oldSize: Size,
    newSize: Size,
    oldPosition: Position,
    newPosition: Position,
    updateSize: (objectId: string, size: Size, position: Position) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._objectId = objectId;
    this._oldSize = { ...oldSize };
    this._newSize = { ...newSize };
    this._oldPosition = { ...oldPosition };
    this._newPosition = { ...newPosition };
    this._updateSize = updateSize;
  }

  execute(): void {
    this._updateSize(this._objectId, this._newSize, this._newPosition);
  }

  undo(): void {
    this._updateSize(this._objectId, this._oldSize, this._oldPosition);
  }
}

/**
 * Command for rotating board objects.
 */
export class RotateObjectCommand extends BaseCommand {
  readonly type: CommandType = 'rotate';
  readonly description = 'Rotate object';

  private _objectId: string;
  private _oldRotation: number;
  private _newRotation: number;
  private _updateRotation: (objectId: string, rotation: number) => void;

  /**
   * Create a new RotateObjectCommand.
   *
   * @param objectId - ID of object to rotate
   * @param oldRotation - Original rotation in degrees
   * @param newRotation - New rotation in degrees
   * @param updateRotation - Function to update object rotation
   * @param executedBy - User executing the command
   */
  constructor(
    objectId: string,
    oldRotation: number,
    newRotation: number,
    updateRotation: (objectId: string, rotation: number) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._objectId = objectId;
    this._oldRotation = oldRotation;
    this._newRotation = newRotation;
    this._updateRotation = updateRotation;
  }

  execute(): void {
    this._updateRotation(this._objectId, this._newRotation);
  }

  undo(): void {
    this._updateRotation(this._objectId, this._oldRotation);
  }
}

/**
 * Command for editing object content.
 */
export class EditContentCommand extends BaseCommand {
  readonly type: CommandType = 'edit';
  readonly description = 'Edit content';

  private _objectId: string;
  private _oldContent: string;
  private _newContent: string;
  private _updateContent: (objectId: string, content: string) => void;

  /**
   * Create a new EditContentCommand.
   *
   * @param objectId - ID of object to edit
   * @param oldContent - Original content
   * @param newContent - New content
   * @param updateContent - Function to update object content
   * @param executedBy - User executing the command
   */
  constructor(
    objectId: string,
    oldContent: string,
    newContent: string,
    updateContent: (objectId: string, content: string) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._objectId = objectId;
    this._oldContent = oldContent;
    this._newContent = newContent;
    this._updateContent = updateContent;
  }

  execute(): void {
    this._updateContent(this._objectId, this._newContent);
  }

  undo(): void {
    this._updateContent(this._objectId, this._oldContent);
  }

  canMergeWith(other: ICommand): boolean {
    if (other.type !== 'edit') return false;
    const otherEdit = other as EditContentCommand;
    return this._objectId === otherEdit._objectId;
  }

  mergeWith(other: ICommand): ICommand {
    const otherEdit = other as EditContentCommand;
    return new EditContentCommand(
      this._objectId,
      this._oldContent,
      otherEdit._newContent,
      this._updateContent,
      this.executedBy
    );
  }
}

/**
 * Command for changing object colors.
 */
export class ChangeColorCommand extends BaseCommand {
  readonly type: CommandType = 'color';
  readonly description = 'Change color';

  private _objectId: string;
  private _oldColors: Partial<ColorScheme>;
  private _newColors: Partial<ColorScheme>;
  private _updateColors: (objectId: string, colors: Partial<ColorScheme>) => void;

  /**
   * Create a new ChangeColorCommand.
   *
   * @param objectId - ID of object to change
   * @param oldColors - Original colors
   * @param newColors - New colors
   * @param updateColors - Function to update object colors
   * @param executedBy - User executing the command
   */
  constructor(
    objectId: string,
    oldColors: Partial<ColorScheme>,
    newColors: Partial<ColorScheme>,
    updateColors: (objectId: string, colors: Partial<ColorScheme>) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._objectId = objectId;
    this._oldColors = { ...oldColors };
    this._newColors = { ...newColors };
    this._updateColors = updateColors;
  }

  execute(): void {
    this._updateColors(this._objectId, this._newColors);
  }

  undo(): void {
    this._updateColors(this._objectId, this._oldColors);
  }
}

/**
 * Command for duplicating objects.
 */
export class DuplicateObjectsCommand extends BaseCommand {
  readonly type: CommandType = 'duplicate';
  readonly description: string;

  private _originalIds: string[];
  private _duplicatedObjects: IBoardObject[];
  private _addToBoard: (object: IBoardObject) => void;
  private _removeFromBoard: (objectId: string) => void;
  private _offset: Position;

  /**
   * Create a new DuplicateObjectsCommand.
   *
   * @param originalObjects - Objects to duplicate
   * @param addToBoard - Function to add object to board
   * @param removeFromBoard - Function to remove object from board
   * @param executedBy - User executing the command
   * @param offset - Offset for duplicated objects
   */
  constructor(
    originalObjects: IBoardObject[],
    addToBoard: (object: IBoardObject) => void,
    removeFromBoard: (objectId: string) => void,
    executedBy: string,
    offset: Position = { x: 20, y: 20 }
  ) {
    super(executedBy);
    this._originalIds = originalObjects.map((obj) => obj.id);
    this._offset = offset;
    this._addToBoard = addToBoard;
    this._removeFromBoard = removeFromBoard;

    this._duplicatedObjects = originalObjects.map((obj) => {
      const clone = obj.clone();
      clone.position = {
        x: obj.position.x + offset.x,
        y: obj.position.y + offset.y,
      };
      return clone;
    });

    this.description =
      originalObjects.length === 1
        ? 'Duplicate object'
        : `Duplicate ${originalObjects.length} objects`;
  }

  get duplicatedIds(): string[] {
    return this._duplicatedObjects.map((obj) => obj.id);
  }

  execute(): void {
    for (const object of this._duplicatedObjects) {
      this._addToBoard(object);
    }
  }

  undo(): void {
    for (const object of this._duplicatedObjects) {
      this._removeFromBoard(object.id);
    }
  }
}

/**
 * Command for pasting objects from clipboard.
 */
export class PasteObjectsCommand extends BaseCommand {
  readonly type: CommandType = 'paste';
  readonly description: string;

  private _pastedObjects: IBoardObject[];
  private _addToBoard: (object: IBoardObject) => void;
  private _removeFromBoard: (objectId: string) => void;

  /**
   * Create a new PasteObjectsCommand.
   *
   * @param objects - Objects to paste (already cloned with new IDs)
   * @param addToBoard - Function to add object to board
   * @param removeFromBoard - Function to remove object from board
   * @param executedBy - User executing the command
   */
  constructor(
    objects: IBoardObject[],
    addToBoard: (object: IBoardObject) => void,
    removeFromBoard: (objectId: string) => void,
    executedBy: string
  ) {
    super(executedBy);
    this._pastedObjects = objects;
    this._addToBoard = addToBoard;
    this._removeFromBoard = removeFromBoard;
    this.description =
      objects.length === 1 ? 'Paste object' : `Paste ${objects.length} objects`;
  }

  get pastedIds(): string[] {
    return this._pastedObjects.map((obj) => obj.id);
  }

  execute(): void {
    for (const object of this._pastedObjects) {
      this._addToBoard(object);
    }
  }

  undo(): void {
    for (const object of this._pastedObjects) {
      this._removeFromBoard(object.id);
    }
  }
}

/**
 * Command for reordering objects (z-index changes).
 */
export class ReorderObjectsCommand extends BaseCommand {
  readonly type: CommandType = 'reorder';
  readonly description: string;

  private _objectIds: string[];
  private _oldZIndices: Map<string, number>;
  private _newZIndices: Map<string, number>;
  private _updateZIndex: (objectId: string, zIndex: number) => void;

  /**
   * Create a new ReorderObjectsCommand.
   *
   * @param objectIds - IDs of objects to reorder
   * @param oldZIndices - Original z-indices
   * @param newZIndices - New z-indices
   * @param updateZIndex - Function to update object z-index
   * @param executedBy - User executing the command
   * @param description - Description of the reorder operation
   */
  constructor(
    objectIds: string[],
    oldZIndices: Map<string, number>,
    newZIndices: Map<string, number>,
    updateZIndex: (objectId: string, zIndex: number) => void,
    executedBy: string,
    description: string = 'Reorder objects'
  ) {
    super(executedBy);
    this._objectIds = objectIds;
    this._oldZIndices = new Map(oldZIndices);
    this._newZIndices = new Map(newZIndices);
    this._updateZIndex = updateZIndex;
    this.description = description;
  }

  execute(): void {
    for (const id of this._objectIds) {
      const newZ = this._newZIndices.get(id);
      if (newZ !== undefined) {
        this._updateZIndex(id, newZ);
      }
    }
  }

  undo(): void {
    for (const id of this._objectIds) {
      const oldZ = this._oldZIndices.get(id);
      if (oldZ !== undefined) {
        this._updateZIndex(id, oldZ);
      }
    }
  }
}

/**
 * Command that batches multiple commands into one undo/redo operation.
 */
export class BatchCommand implements IBatchCommand {
  readonly id: string;
  readonly type: CommandType = 'batch';
  readonly description: string;
  readonly timestamp: number;
  readonly executedBy: string;
  readonly commands: ICommand[];

  /**
   * Create a new BatchCommand.
   *
   * @param commands - Commands to batch
   * @param executedBy - User executing the command
   * @param description - Optional description
   */
  constructor(
    commands: ICommand[],
    executedBy: string,
    description?: string
  ) {
    this.id = generateUUID();
    this.timestamp = Date.now();
    this.executedBy = executedBy;
    this.commands = commands;
    this.description =
      description ?? `Batch of ${commands.length} operations`;
  }

  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}
