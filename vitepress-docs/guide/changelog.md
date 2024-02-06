---
aside: false
footer: true
page: true
title: Changelog
---

## Changelog


### v: 1.2.10 (2024-02-xx)
* __Demo App__ [Eventlog is not displaying any resize events.](https://github.com/gwinnem/vue-responsive-grid-layout/issues/46)
* 


### v: 1.2.9 (2024-02-03)
* __Fixed Issue__ [Dynamic change columns, item will overlap](https://github.com/gwinnem/vue-responsive-grid-layout/issues/12)


### v: 1.2.8 (2024-01-25)
* __Fixed Issue__ [Unexpected Behavior when dragging items](https://github.com/gwinnem/vue-responsive-grid-layout/issues/54) Tnxs to [T0miii](https://github.com/T0miii)


### v: 1.2.7 (2024-01-10)
* __Fixed Issue__ [option "responsive" not working](https://github.com/gwinnem/vue-responsive-grid-layout/issues/51). Tnxs to [T0miii](https://github.com/T0miii)


### v: 1.2.6 (2023-12-28)
* __Fixed Issue__ Problem if layout doesnt have static item [PullRequest](https://github.com/gwinnem/vue-responsive-grid-layout/pull/47)


### v: 1.2.5 (2023-12-14)
* __Fixed Issue__ [editMode not working as expected](https://github.com/gwinnem/vue-responsive-grid-layout/issues/33)
* __Documentation__ Updated config so when refreshing a page it loads the correct page and not the 404 page.
* __Demo App__ Added inputs for Margins.
* __Refactor__ Updated style for gridlines in GridLayout.vue.
* __Config__ Added style linting to project.
* __Config__ Updated scripts section in package.json.
* __Demo App__ Fixed index value when dropping a new GridItem onto the layout. This only works when index is a numeric value.
* __Demo App__ Added checks so number input can not have less than 1.
* __Tests__ Added more unit tests and refactored code so it is easier to test.



### v: 1.2.4 (2023-10-23)

* __Fixed Issue__ [Layout update event is raised before update is finished](https://github.com/gwinnem/vue-responsive-grid-layout/issues/19). Tnxs to [SamGeems](https://github.com/SamGeens)
* __Fixed issue__ [Close button css is different from the example](https://github.com/gwinnem/vue-responsive-grid-layout/issues/20). Tnxs to [SamGeems](https://github.com/SamGeens)
* __Feature__ Added event __drag-end__ to GridLayout.
* __Feature__ Added event __drag-move__ to GridLayout.
* __Feature__ Added event __drag-start__ to GridLayout.
* __Codebase__ Renamed EGridLayoutEvent value UPDATE_LAYOUT to LAYOUT_UPDATE.
* __Codebase__ Removed file EDragEvents and updated GridLayout. Values are implemented in EGridLayoutEvent.
* __Codebase__ Added documentation to file DOM.ts
* __Codebase__ Added new enum for drag events and refactored GridLayout to use new enum.
* __Refactor__ Removed obsolete enum EMovingDirections.
* __Demo App__ Added button for clearing the event log.
* __Demo App__ Added Dropdown for filtering on events.

### v: 1.2.2 (2023-09-19)

* __Fixed Issue__ [Drag and Drop from outside is not working when distributeEvenly prop is set](https://github.com/gwinnem/vue-responsive-grid-layout/issues/5)
* __Partial Fix__ [Resizemove edges case handling is incomplete](https://github.com/gwinnem/vue-responsive-grid-layout/issues/13)
  * __Right, Right Bottom and Bottom__ resize fixed.
  * __Left, Top Left, Top and Top Right__ resize not fixed.
* __Codebase__ Adding description to functions.
* __Codebase__ Added contributors to package.json.
* __Codebase__ Added badges to README file.
* __Codebase__ Fixed outdated dependencies.

Thanks to [UTing1119](https://github.com/UTing1119) for his contribution to this release.

### v: 1.2.1 (2023-05-07)

* --Fixed Issue-- [Issue 7](https://github.com/gwinnem/vue-responsive-grid-layout/issues/7), thanks to [UTing1119](https://github.com/UTing1119)
* --Fixed Issue-- [Issue 6](https://github.com/gwinnem/vue-responsive-grid-layout/issues/6), thanks to [UTing1119](https://github.com/UTing1119)
