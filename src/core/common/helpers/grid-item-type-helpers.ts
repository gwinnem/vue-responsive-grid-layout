import { ILayoutItem, TLayout } from '@/components/Grid/layout-definition';

/**
 * Get all static elements.
 * @param  {Array} layout Array of layout objects.
 * @return {Array}        Array of static layout items — `[]` for an empty layout (see docs/REFACTORING.md #9/#33: an empty layout is a normal state, not an error).
 */

export function getAllStaticGridItems(layout: TLayout): ILayoutItem[] {
  return layout.filter(l => l.isStatic);
}

/**
 * Get all non-static elements. Not currently called anywhere in `src/`
 * outside its own test — kept as the natural counterpart to
 * {@link getAllStaticGridItems} for consumers who need it.
 * @param  {Array} layout Array of layout objects.
 * @return {Array}        Array of non-static layout items — `[]` for an empty layout.
 */

export function getAllNonStaticGridItems(layout: TLayout): ILayoutItem[] {
  return layout.filter(l => !l.isStatic);
}
