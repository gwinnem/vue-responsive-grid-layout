import { describe, expect, it } from 'vitest';
import { readOutsideDropPayload } from '../src/core/gridlayout/helpers/outside-drop-payload';

const mockDataTransfer = (data: Record<string, string>): DataTransfer => ({
  getData: (mimeType: string) => data[mimeType] ?? ``,
} as unknown as DataTransfer);

describe(`readOutsideDropPayload`, () => {
  it(`Should parse a JSON payload set under the default text/plain MIME type`, () => {
    const dataTransfer = mockDataTransfer({ 'text/plain': JSON.stringify({ label: `widget-a` }) });

    expect(readOutsideDropPayload(dataTransfer)).toStrictEqual({ label: `widget-a` });
  });

  it(`Should parse a JSON payload set under a custom MIME type`, () => {
    const dataTransfer = mockDataTransfer({ 'application/x-my-widget': JSON.stringify({ id: 42 }) });

    expect(readOutsideDropPayload(dataTransfer, `application/x-my-widget`)).toStrictEqual({ id: 42 });
  });

  it(`Should return null when the MIME type has nothing set`, () => {
    const dataTransfer = mockDataTransfer({});

    expect(readOutsideDropPayload(dataTransfer)).toBeNull();
  });

  it(`Should return null for malformed JSON rather than throwing`, () => {
    const dataTransfer = mockDataTransfer({ 'text/plain': `{not valid json` });

    expect(() => readOutsideDropPayload(dataTransfer)).not.toThrow();
    expect(readOutsideDropPayload(dataTransfer)).toBeNull();
  });

  it(`Should return null when dataTransfer itself is null or undefined`, () => {
    expect(readOutsideDropPayload(null)).toBeNull();
    expect(readOutsideDropPayload(undefined)).toBeNull();
  });

  it(`Should parse primitive JSON values, not just objects`, () => {
    const dataTransfer = mockDataTransfer({ 'text/plain': JSON.stringify(`just a string`) });

    expect(readOutsideDropPayload(dataTransfer)).toBe(`just a string`);
  });
});
