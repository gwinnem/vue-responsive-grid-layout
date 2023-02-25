---
page: true
title: Installation
---

# Installation

## NPM
```
	npm install vue-responsive-grid-layout --save
```

## Yarn
```
    yarn add vue-responsive-grid-layout
```

## Import the package

```typescript
    import VueResponsiveGridLayout from 'vue-responsive-grid-layout';
```

Add to other Vue components using Options api.

```typescript
    export default {
        components: {
            GridLayout: VueResponsiveGridLayout.GridLayout,
            GridItem: VueResponsiveGridLayout.GridItem
        },
    // ... data, methods, mounted (), etc.
    }
```

Add to other Vue components using Composition api.

```html
<script setup>
  import { GridItem, GridLayout } from 'vue-responsive-grid-layout';
</script>
```
