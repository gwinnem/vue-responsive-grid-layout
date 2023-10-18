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
              text: 'Eventbus (Mitt)',
              link: '/api/interfaces-eventBus'
            },
            {
              text: 'Layout',
              link: '/api/interfaces-layout',
            }
          ],
        },
        {
          text: 'Types',
          collapsible: true,
          collapsed: false,
          items: [
            {
              text: 'Layout',
              link: '/api/types-layout',
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
          ],
        },
        {
          text: 'GridItem',
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
      text: 'Examples',
      items: [
        {
          text: 'Basic drag and resize',
          link: '/examples/01-example'
        },
        {
          text: 'Bounded drag to container',
          link: '/examples/02-example'
        },
        {
          text: 'Events',
          link: '/examples/03-example'
        },
        // {
        //   text: 'Multiple Grids',
        //   link: '/examples/04-example'
        // },
        {
          text: 'Drag allow/ignore elements',
          link: '/examples/05-example'
        },
        {
          text: 'Mirrored (rtl)',
          link: '/examples/06-example'
        },
        {
          text: 'Responsive breakpoints',
          link: '/examples/07-example'
        },
        {
          text: 'Prevent Collision',
          link: '/examples/08-example'
        },
        // {
        //   text: 'Responsive predefined layouts',
        //   link: '/examples/09-example'
        // },
        {
          text: 'Add or Remove items',
          link: '/examples/10-example'
        },
        {
          text: 'Drag, drop from outside',
          link: '/examples/11-example'
        },
        // {
        //   text: 'Drag, drop from grid to grid',
        //   link: '/examples/12-example'
        // },
        {
          text: 'Show Close Button',
          link: '/examples/13-example'
        },
        {
          text: 'Add default border-radius',
          link: '/examples/14-example'
        },
        {
          text: 'Horizontal shift GridItems',
          link: '/examples/15-example'
        },
        {
          text: 'ShowGridLines',
          link: '/examples/16-example'
        },
      ],
    },
  ];
}
