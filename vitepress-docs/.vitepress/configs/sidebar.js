export default {
  '/api/': getApiSidebar(),
  '/components/': getComponentsSidebar(),
  '/guide/': getGuideSidebar(),
  '/examples/': getExamplesSidebar(),
};

function getApiSidebar() {
  return [
    {
      text: 'API',
      collapsible: false,
      items: [
        {
          text: 'Interfaces',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: 'Component Props',
              link: '/api/interfaces-props',
            },
            {
              text: 'Eventbus (Mitt)',
              link: '/api/interfaces-eventBus'
            },
            {
              text: 'Layout',
              link: '/api/interfaces-layout',
            },
            {
              text: 'Event Payload & Exposed State',
              link: '/api/interfaces-events-and-state',
            }
          ],
        },
        {
          text: 'Types',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: 'Layout & Breakpoints',
              link: '/api/types-layout',
            },
          ],
        },
        {
          text: 'Persistence',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: 'useLayoutStorage & functions',
              link: '/api/persistence',
            },
          ],
        },
        {
          text: 'Framework-agnostic core',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: '/core entry point',
              link: '/api/core',
            },
          ],
        },
        {
          text: 'Enums',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: 'EGridLayoutEvent',
              link: '/api/GridLayout-enums',
            },
            {
              text: 'EGridItemEvent',
              link: '/api/GridItem-enums',
            },
          ],
        }
      ],
    },
  ];
}

function getComponentsSidebar() {
  return [
    {
      text: 'Components',
      link: '/components/',
      items: [
        {
          text: 'GridLayout',
          link: '/components/grid-layout',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: 'Props',
              link: '/components/grid-layout-props',
            },
            {
              text: 'VUE Events',
              link: '/components/grid-layout-events',
            },
            {
              text: 'Eventbus Events',
              link: '/components/grid-layout-event-bus-events',
            },
            {
              text: 'Slots',
              link: '/components/grid-layout-slots',
            },
          ],
        },
        {
          text: 'GridItem',
          link: '/components/grid-item',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: 'Props',
              link: '/components/grid-item-props',
            },
            {
              text: 'VUE Events',
              link: '/components/grid-item-events',
            },
            {
              text: 'Eventbus Events',
              link: '/components/grid-item-event-bus-events',
            },
            {
              text: 'Slots',
              link: '/components/grid-item-slots',
            },
          ],
        },
      ],
    },
    {
      text: 'Styling',
      items: [
        {
          text: 'Variables',
          link: '/components/css-variables',
        },
        {
          text: 'GridLayout',
          link: '/components/css-grid-layout',
        },
        {
          text: 'GridItem',
          link: '/components/css-grid-item',
        },
      ],
    },
  ];
}

function getGuideSidebar() {
  return [
    {
      text: 'Guide',
      items: [
        {
          text: 'Introduction',
          link: '/guide/introduction',
        },
        {
          text: 'Installation',
          link: '/guide/installation',
        },
        {
          text: 'Understanding Layouts',
          link: '/guide/understanding-layouts',
        },
        {
          text: 'Test Coverage',
          link: '/guide/coverage',
        },
        {
          text: 'Changelog',
          link: '/guide/changelog',
        },
        {
          text: 'Roadmap',
          link: '/guide/roadmap',
        },
      ],
    },
  ];
}

function getExamplesSidebar() {
  return [
    {
      text: 'Basics',
      items: [
        { text: '1. Basic drag & resize', link: '/examples/01-example' },
        { text: '2. Bounded drag to container', link: '/examples/02-example' },
        { text: '3. Events', link: '/examples/03-example' },
        { text: '4. Multiple grids', link: '/examples/04-example' },
        { text: '5. Drag allow/ignore elements', link: '/examples/05-example' },
        { text: '6. Mirrored (RTL)', link: '/examples/06-example' },
      ],
    },
    {
      text: 'Layout behavior',
      items: [
        { text: '7. Responsive breakpoints', link: '/examples/07-example' },
        { text: '8. Prevent collision', link: '/examples/08-example' },
        { text: '9. Responsive predefined layouts', link: '/examples/09-example' },
        { text: '10. Add or remove items', link: '/examples/10-example' },
        { text: '17. Static items', link: '/examples/17-example' },
        { text: '20. Auto-size grid on content', link: '/examples/20-example' },
        { text: '21. Edit mode toggle', link: '/examples/21-example' },
      ],
    },
    {
      text: 'Drag & drop',
      items: [
        { text: '11. Drag, drop from outside', link: '/examples/11-example' },
        { text: '12. Drag, drop from grid to grid', link: '/examples/12-example' },
        { text: '22. Cross-grid drop restrictions', link: '/examples/22-example' },
        { text: '23. Drag, drop from outside into multiple grids', link: '/examples/23-example' },
        { text: '24. Configurable transition duration & easing', link: '/examples/24-example' },
        { text: '25. Custom drag-placeholder content', link: '/examples/25-example' },
        { text: '26. Alignment guides while dragging', link: '/examples/26-example' },
        { text: '27. scrollToItem & focusItem', link: '/examples/27-example' },
        { text: '28. Export layout as SVG', link: '/examples/28-example' },
        { text: '29. compactNow, rearrange & duplicateItem', link: '/examples/29-example' },
        { text: '30. Blocked-move feedback', link: '/examples/30-example' },
        { text: '31. Per-item autoHeight', link: '/examples/31-example' },
        { text: '32. Snap to grid', link: '/examples/32-example' },
        { text: '33. Configurable resize-hint appearance', link: '/examples/33-example' },
        { text: '34. outsideDropAccept & readOutsideDropPayload', link: '/examples/34-example' },
        { text: '35. Named layout presets', link: '/examples/35-example' },
        { text: '36. Localizable ARIA strings', link: '/examples/36-example' },
        { text: '37. Multi-select & group move/resize', link: '/examples/37-example' },
        { text: '38. Size constraints & aspect ratio', link: '/examples/38-example' },
        { text: '39. autoScroll', link: '/examples/39-example' },
        { text: '40. Layout lifecycle events', link: '/examples/40-example' },
        { text: '41. Layout bounds & rendering options', link: '/examples/41-example' },
        { text: '42. Pluggable compaction (compactType & compactor)', link: '/examples/42-example' },
        { text: '43. Undo/redo (enableUndoRedo)', link: '/examples/43-example' },
        { text: '44. Grid dimensions (rowHeight, colNum, margin)', link: '/examples/44-example' },
        { text: '45. Switching layouts & forcing a remount', link: '/examples/45-example' },
      ],
    },
    {
      text: 'Styling & customization',
      items: [
        { text: '13. Show close button', link: '/examples/13-example' },
        { text: '14. Border radius', link: '/examples/14-example' },
        { text: '15. Horizontal shift', link: '/examples/15-example' },
        { text: '16. Show grid lines', link: '/examples/16-example' },
        { text: '18. Custom drag handle & close button', link: '/examples/18-example' },
      ],
    },
    {
      text: 'Data & persistence',
      items: [
        { text: '19. v-model & save/load layout', link: '/examples/19-example' },
      ],
    },
  ];
}
