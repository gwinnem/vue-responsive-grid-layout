import { Ref } from 'vue';
import { calcColWidth } from '@/core/griditem/helpers/grid-item-calculate-helper';
import { IPlaceholder } from '@/core/gridlayout/interfaces/layout-data.interface';
import { EGridLayoutEvent } from '@/core/gridlayout/enums/EGridLayoutEvents';
import { IGridLayoutProps } from '../grid-layout-props.interface';

/** Dependencies `useOutsideDrop` needs from `GridLayout.vue`. */
export interface IUseOutsideDropContext {
  props: IGridLayoutProps;
  /** Vue's own overloaded `defineEmits` type can't be narrowed past `any` here — see `useCrossGridDrag.ts`'s own `IUseCrossGridDragContext.emit` for the full rationale (tried and reverted two narrower alternatives, both broke real call-site assignment). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (...args: any[]) => void;
  /** `GridLayout`'s own root element ref — where the native drag-and-drop listeners attach. */
  refsLayout: Ref<HTMLElement>;
  /** The container's last measured pixel width — used for the same grid-position-from-pixel math the rest of this file uses. */
  width: Ref<number | null>;
  placeholder: Ref<IPlaceholder>;
  isDragging: Ref<boolean>;
}

/**
 * Encapsulates `allowOutsideDrop`: native HTML5 drag-and-drop from
 * outside the grid system entirely (e.g. a `draggable="true"` element
 * elsewhere on the page, not another `GridItem`) — distinct from
 * `allowCrossGridDrag` (`useCrossGridDrag.ts`), which is for dragging an
 * *existing* item between two `GridLayout` instances via interact.js's
 * own pointer-based dragging, not the browser's native drag-and-drop API.
 *
 * Extracted from `GridLayout.vue` as part of the structural cleanup
 * flagged in `docs/REFACTORING.md`'s Structural section — see
 * `docs/ARCHITECTURE.md` for the full design this composable
 * implements, and finding #68 there for the extraction itself.
 */
export function useOutsideDrop(ctx: IUseOutsideDropContext): { setOutsideDropEnabled: (enabled: boolean) => void } {
  const { props, emit, refsLayout, width, placeholder, isDragging } = ctx;

  /**
   * `dragenter`/`dragleave` bubble from every descendant element, firing
   * far more often than just "entered/left the grid as a whole" — an
   * enter-count (incremented on `dragenter`, decremented on
   * `dragleave`, treated as "actually left" only once it returns to
   * zero) is the standard workaround, tracking net entries/exits rather
   * than reacting to every single bubble individually, which would
   * otherwise flicker the placeholder's visibility on and off
   * repeatedly while the pointer moves around inside the grid. Only
   * actually hiding it once the count returns to zero means it stays
   * visible for as long as the drag is anywhere inside the grid, at any
   * depth.
   */
  let dragEnterCount = 0;

  const outsideDropPositionFromEvent = (event: DragEvent): { x: number; y: number } => {
    const rect = refsLayout.value.getBoundingClientRect();
    const margin = props.margin!;
    const colWidth = calcColWidth(width.value ?? rect.width, margin[0], props.colNum as number);
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;

    let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
    let y = Math.round((top - margin[1]) / ((props.rowHeight as number) + margin[1]));
    x = Math.max(Math.min(x, (props.colNum as number) - (props.outsideDropWidth as number)), 0);
    y = Math.max(Math.min(y, (props.maxRows as number) - (props.outsideDropHeight as number)), 0);

    return { x, y };
  };

  const outsideDropAccepted = (event: DragEvent): boolean => {
    if(!props.outsideDropAccept) {
      return true;
    }
    return props.outsideDropAccept(event.dataTransfer);
  };

  const onOutsideDragEnter = (event: DragEvent): void => {
    if(!outsideDropAccepted(event)) {
      // Deliberately no preventDefault() here — leaving the browser's
      // own default drag-and-drop handling in place is what tells it
      // this isn't a valid drop target for this particular drag,
      // showing the native "not allowed" cursor rather than this grid's
      // own live placeholder. Not incrementing dragEnterCount either,
      // so a later dragleave for this same rejected drag doesn't
      // decrement it into the negative relative to genuinely-accepted
      // drags that might be in progress from a different element.
      return;
    }
    event.preventDefault();
    dragEnterCount += 1;
  };

  const onOutsideDragOver = (event: DragEvent): void => {
    if(!outsideDropAccepted(event)) {
      return;
    }
    // Required per the HTML5 drag-and-drop spec: without preventDefault()
    // here, the browser never treats this element as a valid drop
    // target, and the native `drop` event below would never fire — see
    // docs/REFACTORING.md #30 for the exact same gotcha caught once
    // already, in an earlier (later replaced) cross-grid approach.
    event.preventDefault();
    const { x, y } = outsideDropPositionFromEvent(event);
    placeholder.value.i = `__outside_drop_placeholder__`;
    placeholder.value.x = x;
    placeholder.value.y = y;
    placeholder.value.w = props.outsideDropWidth as number;
    placeholder.value.h = props.outsideDropHeight as number;
    isDragging.value = true;
  };

  const onOutsideDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    dragEnterCount = Math.max(0, dragEnterCount - 1);
    if(dragEnterCount === 0) {
      isDragging.value = false;
    }
  };

  const onOutsideDrop = (event: DragEvent): void => {
    if(!outsideDropAccepted(event)) {
      return;
    }
    event.preventDefault();
    dragEnterCount = 0;
    isDragging.value = false;
    const { x, y } = outsideDropPositionFromEvent(event);
    emit(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE, {
      dataTransfer: event.dataTransfer,
      h: props.outsideDropHeight as number,
      w: props.outsideDropWidth as number,
      x,
      y,
    });
  };

  /**
   * Attaches/detaches the four native listeners on `refsLayout.value`.
   * Called once from `onMounted` for the initial `allowOutsideDrop`
   * value, and again whenever that prop changes reactively — the same
   * two-call-site pattern `useCrossGridDrag`'s
   * `setCrossGridDragEnabled` uses, for the same reason (toggling the
   * prop at runtime needs to actually take effect).
   */
  const setOutsideDropEnabled = (enabled: boolean): void => {
    const el = refsLayout.value;
    if(!el) {
      return;
    }
    if(enabled) {
      el.addEventListener(`dragenter`, onOutsideDragEnter);
      el.addEventListener(`dragover`, onOutsideDragOver);
      el.addEventListener(`dragleave`, onOutsideDragLeave);
      el.addEventListener(`drop`, onOutsideDrop);
    } else {
      el.removeEventListener(`dragenter`, onOutsideDragEnter);
      el.removeEventListener(`dragover`, onOutsideDragOver);
      el.removeEventListener(`dragleave`, onOutsideDragLeave);
      el.removeEventListener(`drop`, onOutsideDrop);
      dragEnterCount = 0;
    }
  };

  return { setOutsideDropEnabled };
}
