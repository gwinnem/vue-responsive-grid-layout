const hasWindow = (): boolean => {
  return typeof window !== `undefined`;
};

export const addWindowEventListener = (event: string, callback: () => any): boolean => {
  if(!hasWindow) {
    callback();
    return false;
  }
  window.addEventListener(event, callback);
  return true;
};

export const removeWindowEventListener = (event: string, callback: () => any): void => {
  if(!hasWindow) {
    return;
  }
  window.removeEventListener(event, callback);
};
