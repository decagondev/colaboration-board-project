/**
 * Editable Interface
 *
 * For objects whose content can be edited in-place.
 */

/**
 * Edit mode states.
 */
export type EditMode = 'view' | 'edit' | 'preview';

/**
 * Edit event types.
 */
export type EditEventType =
  | 'edit-start'
  | 'edit-change'
  | 'edit-end'
  | 'edit-cancel';

/**
 * Edit event data.
 */
export interface EditEvent {
  /** Event type */
  type: EditEventType;
  /** Object ID being edited */
  objectId: string;
  /** Previous content (for edit-change, edit-end) */
  previousContent?: string;
  /** Current/new content */
  content?: string;
}

/**
 * Interface for objects that can be edited.
 *
 * Editable objects have content (text, rich text, etc.) that
 * can be modified through direct interaction.
 */
export interface IEditable {
  /**
   * Current edit mode.
   */
  editMode: EditMode;

  /**
   * The editable content.
   */
  content: string;

  /**
   * Enter edit mode.
   *
   * @returns True if edit mode was entered
   */
  startEditing(): boolean;

  /**
   * Exit edit mode, saving changes.
   *
   * @returns True if changes were saved
   */
  finishEditing(): boolean;

  /**
   * Cancel editing, discarding changes.
   */
  cancelEditing(): void;

  /**
   * Update content while editing.
   *
   * @param content - New content
   */
  updateContent(content: string): void;

  /**
   * Get the content before editing started.
   *
   * @returns Original content or null if not editing
   */
  getOriginalContent(): string | null;

  /**
   * Check if there are unsaved changes.
   *
   * @returns True if content has been modified
   */
  hasUnsavedChanges(): boolean;

  /**
   * Whether the object can be edited.
   */
  readonly isEditable: boolean;

  /**
   * Maximum content length (optional).
   */
  readonly maxContentLength?: number;

  /**
   * Placeholder text when content is empty.
   */
  readonly placeholder?: string;
}

/**
 * Type guard to check if an object is editable.
 *
 * @param obj - Object to check
 * @returns True if object implements IEditable
 */
export function isEditable(obj: unknown): obj is IEditable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'editMode' in obj &&
    'content' in obj &&
    typeof (obj as IEditable).startEditing === 'function' &&
    typeof (obj as IEditable).finishEditing === 'function'
  );
}
