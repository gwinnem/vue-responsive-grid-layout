function hasWindow(): boolean {
  return typeof window !== `undefined`;
}

export function addWindowEventListener(event: string, callback: () => any): boolean {
  if(!hasWindow) {
    callback();
    return false;
  }
  window.addEventListener(event, callback);
  return true;
}

export function removeWindowEventListener(event: string, callback: () => any): void {
  if(!hasWindow) {
    return;
  }
  window.removeEventListener(event, callback);
}
