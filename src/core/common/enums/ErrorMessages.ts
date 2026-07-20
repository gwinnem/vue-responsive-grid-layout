/**
 * Error messages thrown by the validators and grid-math helpers in
 * `src/core/**`. Grouped in one enum so every thrown error in the library
 * has a single, greppable source of truth for its wording, and so
 * `expect(() => fn()).toThrowError(EErrorMessage.X)` in tests doesn't rely on
 * copy-pasted string literals matching by coincidence.
 */
export enum EErrorMessage {
  INVALID_BREAKPOINT = 'Invalid parameter breakpoint',
  INVALID_BREAKPOINT_NOT_FOUND = 'Breakpoint not found',
  INVALID_BOUNDS = 'Invalid parameter bounds passed',
  INVALID_COL_OR_ROW_SIZE = 'Invalid colOrRowSize parameter passed',
  INVALID_COLUMNS = 'Invalid parameter cols passed',
  INVALID_EMPTY_LAYOUT = 'Layout can not be empty',
  INVALID_GRID_UNITS = 'Invalid gridUnits parameter passed',
  INVALID_LAYOUT = 'Invalid parameter layout passed',
  INVALID_LAYOUT_ITEM = 'Invalid parameter layoutItem passed',
  INVALID_LAYOUT_ITEM_ID = 'Invalid parameter layoutItem id passed',
  INVALID_LAYOUT_VALIDATED = 'Layout is not valid',
  INVALID_MARGIN = 'Invalid marginPx parameter passed',
  INVALID_MARGIN_LEFT_RIGHT = 'Invalid parameter marginLeftRight passed',
  INVALID_PARAM_COLS = 'Parameter cols must be greater than 0',
  INVALID_PARAM_CONTAINER_WIDTH = 'Invalid parameter containerWidth passed',
  INVALID_PARAM_INNER_H = 'Parameter innerH must be greater than 0',
  INVALID_PARAM_INNER_W = 'Parameter innerW must be greater than 0',
  INVALID_PARAM_MARGIN = 'Parameter margin must be greater than 0',
  INVALID_PARAM_MAX_ROWS = 'Parameter maxRows must be greater than 0',
  INVALID_PARAM_ROW_HEIGHT = 'Parameter rowHeight must be greater than 0',
  INVALID_PARAMS = 'Invalid parameter values passed',
  INVALID_WIDTH = 'Width must be greater that 0',
}
