import { TLayout } from '@/components/Grid/layout-definition';
import { layoutValidator } from '@/core/validators/layout-validator';

/**
 * Strips the internal `moved` field before serializing. `moved` is set by
 * the compaction/collision helpers to short-circuit infinite loops while
 * cascading moves (see `ILayoutItem`'s own doc comment) — it isn't
 * meaningful state to persist, and feeding a stale `true` back in on
 * restore has no correct interpretation (it's a transient flag, not a
 * fact about the item).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- `moved` is deliberately excluded via destructuring, not read; the whole point of this line is to strip it out of the returned object.
const stripInternalFields = (layout: TLayout): TLayout => layout.map(({ moved: _moved, ...rest }) => rest) as TLayout;

/**
 * Serializes a layout array to a JSON string suitable for persisting
 * (`localStorage`, a file, an API request body, anything that takes a
 * string) — stripping the internal `moved` field first, the one piece of
 * boilerplate every consumer doing this by hand has to remember on their
 * own otherwise. See
 * [v-model & save/load layout](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/19-example.md)
 * for the manual pattern this replaces.
 *
 * @param layout The layout array to serialize.
 * @return A JSON string. Never throws — `JSON.stringify` only throws for
 *   circular references or `BigInt` values, neither of which a valid
 *   `TLayout` can contain.
 */
export function serializeLayout(layout: TLayout): string {
  return JSON.stringify(stripInternalFields(layout));
}

/**
 * Parses a JSON string back into a `TLayout`, validating its shape with
 * the same `layoutValidator` `GridLayout` itself uses at mount — so a
 * layout that round-trips through this function is guaranteed to satisfy
 * exactly the same shape checks the library enforces elsewhere, not a
 * separately-maintained (and possibly inconsistent) set of checks.
 *
 * Never throws: malformed JSON, a valid JSON value that isn't an array of
 * layout items, or an empty/whitespace-only string all return `null`
 * rather than propagating a `SyntaxError` or a validator exception —
 * deliberately, since the primary use case (reading back whatever was
 * last written to `localStorage`) needs a "nothing usable was there" case
 * to handle gracefully, not a thrown error a consumer must remember to
 * catch.
 *
 * @param json A JSON string, typically one `serializeLayout` produced.
 * @return The parsed, validated `TLayout`, or `null` if the string was
 *   empty/missing, not valid JSON, or didn't parse into a valid layout
 *   shape.
 */
export function deserializeLayout(json: string | null | undefined): TLayout | null {
  if(!json) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch{
    return null;
  }

  if(!Array.isArray(parsed)) {
    return null;
  }

  const layout = parsed as TLayout;
  if(!layoutValidator(layout)) {
    return null;
  }

  return layout;
}
