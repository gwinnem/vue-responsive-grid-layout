/**
 * A small helper for `allowOutsideDrop`'s `ITEM_DROPPED_FROM_OUTSIDE`
 * event, whose payload hands back the raw native `DataTransfer` object —
 * every consumer otherwise re-implements the same
 * `dataTransfer.getData(mimeType)`/`JSON.parse` parsing, with the same
 * "what if the MIME type isn't there, or the data isn't valid JSON"
 * questions to answer each time. Same motivation as the layout
 * persistence helpers (`serializeLayout`/`deserializeLayout`, see
 * `docs/FEATURE_RECOMMENDATIONS.md` #2) — a thin, storage/transport-agnostic
 * wrapper around a native browser API most consumers would otherwise
 * hand-roll slightly differently every time.
 *
 * See
 * [Drag, drop from outside](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/11-example.md)
 * for `allowOutsideDrop` itself.
 */

/**
 * Reads and JSON-parses a `DataTransfer` payload by MIME type.
 *
 * Never throws: a missing MIME type (nothing was set under it, or the
 * `dataTransfer` itself is unavailable — native drag-and-drop only
 * exposes `dataTransfer.getData()`'s actual values during the `drop`
 * event itself, not `dragenter`/`dragover`, a common first-time gotcha)
 * and malformed JSON both return `null`, mirroring `deserializeLayout`'s
 * own "nothing usable was there" convention rather than propagating a
 * `SyntaxError` a consumer must remember to catch.
 *
 * This intentionally does no shape validation beyond "valid JSON" —
 * unlike `deserializeLayout`, which validates against a single known
 * shape (`TLayout`), the payload here is whatever the consumer's own
 * drag source chose to attach, so there's no single shape to validate
 * against. Use a type guard or a validation library on the result if
 * the shape matters for a specific use case.
 *
 * @param dataTransfer The native `DataTransfer` from
 *   `ITEM_DROPPED_FROM_OUTSIDE`'s payload (or any other drag/drop/paste
 *   event exposing one).
 * @param mimeType The MIME type the drag source attached the payload
 *   under — e.g. `'application/json'`, or a custom type like
 *   `'application/x-my-widget'`. Defaults to `'text/plain'`, matching
 *   `dataTransfer.setData`'s own default when a consumer's drag source
 *   doesn't specify one.
 * @return The parsed payload, typed as `T` (the caller's own
 *   responsibility to get right — this performs no runtime shape
 *   checking against `T`), or `null` if the MIME type had nothing set,
 *   or what was there wasn't valid JSON.
 */
export function readOutsideDropPayload<T>(
  dataTransfer: DataTransfer | null | undefined,
  mimeType = `text/plain`,
): T | null {
  if(!dataTransfer) {
    return null;
  }

  const raw = dataTransfer.getData(mimeType);
  if(!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch{
    return null;
  }
}
