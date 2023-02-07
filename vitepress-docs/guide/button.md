# Button

Commonly used action buttons.

## Basic usage

Use the `type`, `plain`, `round` and `circle` properties to define the Button's style.

```vue
<template>
  <xl-button>Default</xl-button>
  <xl-button type="primary">Primary</xl-button>
  <xl-button type="success">Success</xl-button>
  <xl-button type="info">Information</xl-button>
  <xl-button type="warning">Warning</xl-button>
  <xl-button type="danger">Danger</xl-button>
</template>
```

## Different sizes

Available in three different sizes of buttons.

```vue
<xl-button type="sm">Small</xl-button>
<xl-button type="md">Medium</xl-button>
<xl-button type="lg">Large</xl-button>
```

## Loading

Click the button to load data, and display the loading status on the button.


```vue
<xl-button>Default</xl-button>
<xl-button type="primary">Primary</xl-button>
<xl-button type="success">Success</xl-button>
<xl-button type="info">Information</xl-button>
<xl-button type="warning">Warning</xl-button>
<xl-button type="danger">Danger</xl-button>
```

## Attributes

| Parameter | Definition | Type    | Optional                                            | Default  |
|-----------|------------|---------|-----------------------------------------------------|----------|
| size      | Size       | string  | large / small / mini                                | default  |
| type      | Type       | string  | primary / success / warning / info / danger / text  | primary  |
| loading   | Loading    | boolean | —                                                   | false    |
