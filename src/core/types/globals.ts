import { TGridLayoutEvent } from './components'

export type Events = {
  'set-col-num': number | undefined
  'recalculate-styles': void
  'resize-event': TGridLayoutEvent
  'drag-event': TGridLayoutEvent
}
