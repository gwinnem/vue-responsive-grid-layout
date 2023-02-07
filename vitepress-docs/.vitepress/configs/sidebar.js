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
          link: '/api/interfaces',
        },
        {
          text: 'Types',
          link: '/api/types/',
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
              text: 'Events',
              link: '/components/grid-layout-events',
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
              text: 'Events',
              link: '/components/grid-item-events',
            },
            {
              text: 'Slots',
              link: '/components/grid-item-slots',
            },
          ],
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
          text: 'Installation',
          link: '/guide/installation',
        },
        {
          text: 'Code examples',
          link: '/guide/code-examples',
        },
        {
          text: 'Changelog',
          link: '/guide/changelog',
        },
        {
          text: 'Roadmap',
          link: '/guide/roadmap',
        },
        {
          text: 'Button vue example',
          link: '/guide/button',
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
          text: 'Example 1',
          link: '/examples/01-example'
        },
        {
          text: 'Example 2',
          link: '/examples/02-example'
        },
        {
          text: 'Example 3',
          link: '/examples/03-example'
        },
        {
          text: 'Example 4',
          link: '/examples/04-example'
        },
      ],
    },
  ];
}
