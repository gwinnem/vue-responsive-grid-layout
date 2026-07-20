/**
 * Selects the built-in compaction strategy `GridLayout` uses (via its
 * own `compactType` prop) whenever the fully-custom `compactor` prop
 * isn't set. Re-exported from the package's public entry point
 * (`src/components/index.ts`) as a real (value) export, so consumers
 * can both type `compactType` and compare/construct against these at
 * runtime — not just a TypeScript-only string union.
 *
 * Replaces the old, separate `verticalCompact: boolean` prop — a
 * single enum-valued prop is easier to extend (see the two `*_OVERLAP`
 * members below, added to match a capability this project didn't
 * previously have at all) and easier to reason about than a growing
 * pile of independent booleans, each only meaningful in combination
 * with the others.
 *
 * Modeled directly on `react-grid-layout` v2's own built-in compactor
 * set (`verticalCompactor`, `horizontalCompactor`, `noCompactor`,
 * `verticalOverlapCompactor`, `horizontalOverlapCompactor` — see its
 * RFC 0001) rather than inventing a different taxonomy, since that's
 * the closest well-known prior art for a pluggable-compaction grid
 * library. `VERTICAL` (this library's own pre-existing
 * `verticalCompact: true`, and RGL's own default) is the default here
 * too, for the same reason.
 */
export enum ECompactType {
  /**
   * No compaction at all — items stay exactly where placed, gaps
   * included. Colliding items still get pushed down out of the way
   * (this project's pre-existing `verticalCompact: false` behavior;
   * items never overlap), which is why this is a distinct member from
   * `VERTICAL_OVERLAP` below, not simply "vertical compaction turned
   * off" — turning compaction off has never meant turning collision
   * resolution off too, and this preserves that.
   */
  NONE = `none`,
  /**
   * Items compact leftward, floating to the smallest available `x`
   * without colliding with anything already placed. New: this project
   * had no horizontal compaction at all before this — only
   * `horizontalShift` (an unrelated, still-separate prop controlling
   * which direction a *colliding* item gets shifted during an active
   * drag, not how the resting layout settles).
   */
  HORIZONTAL = `horizontal`,
  /**
   * Horizontal compaction, but every non-static item is moved straight
   * to `x: 0` unconditionally, ignoring collisions entirely — matching
   * `react-grid-layout`'s own `allowOverlap` semantics applied to
   * compaction specifically (not a full "items may permanently overlap
   * during drag" feature, which is a substantially larger, separate
   * concern this enum doesn't attempt to cover). Items may end up
   * visually overlapping as a result; nothing here resolves that.
   */
  HORIZONTAL_OVERLAP = `horizontal-overlap`,
  /**
   * Items compact upward, floating to the smallest available `y`
   * without colliding with anything already placed. This project's own
   * pre-existing `verticalCompact: true` behavior, and the default for
   * both this enum and (previously) that removed boolean prop.
   */
  VERTICAL = `vertical`,
  /**
   * Vertical compaction, but every non-static item is moved straight to
   * `y: 0` unconditionally, ignoring collisions entirely. Same
   * overlap-during-compaction semantics as `HORIZONTAL_OVERLAP` above,
   * applied to the vertical axis.
   */
  VERTICAL_OVERLAP = `vertical-overlap`,
}
