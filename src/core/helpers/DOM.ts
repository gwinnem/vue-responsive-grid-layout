export type TDirection = `ltr` | `rtl` | `auto`

const currentDir: TDirection = `auto`;

function hasDocument(): boolean {
  return typeof document !== `undefined`;
}

function hasWindow(): boolean {
  return typeof window !== `undefined`;
}

export function getDocumentDir(): TDirection | string {
  if(!hasDocument()) {
    return currentDir;
  }
  return typeof document.dir !== `undefined`
    ? document.dir
    : document.getElementsByTagName(`html`)[0].getAttribute(`dir`) || `auto`;
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

export interface IEventsData {
  eventType: string | symbol;
  h: number;
  i: string | number;
  w: number;
  x: number;
  y: number;
}
