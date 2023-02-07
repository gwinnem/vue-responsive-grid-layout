const hasWindow = (): boolean => typeof window !== `undefined`;

// eslint-disable-next-line consistent-return, @typescript-eslint/explicit-function-return-type
export const addWindowEventListener = (event:string, callback: () => void) => {
  if(!hasWindow) return callback();

  window.addEventListener(event, callback);
};

export const removeWindowEventListener = (event:string, callback: () => void): void => {
  if(!hasWindow) return;

  window.removeEventListener(event, callback);
};
