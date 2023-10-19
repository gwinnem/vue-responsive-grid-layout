/**
 * Checking if the window object exists.
 */
const hasWindow = (): boolean => {
  return typeof window !== `undefined`;
};

/**
 * Adding a event listener to the window object.
 * @param {String}    event     Name of the event to listen for.
 * @param {Function}  callback  Callback function.
 * @see   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 */
export const addWindowEventListener = (event: string, callback: () => any): boolean => {
  if(!hasWindow) {
    callback();
    return false;
  }
  window.addEventListener(event, callback);
  return true;
};

/**
 * Removing a event listener from the window object.
 * @param {String}    event     Name of the event to remove.
 * @param {Function}  callback  Callback function.
 * @see   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
 */
export const removeWindowEventListener = (event: string, callback: () => any): void => {
  if(!hasWindow) {
    return;
  }
  window.removeEventListener(event, callback);
};
