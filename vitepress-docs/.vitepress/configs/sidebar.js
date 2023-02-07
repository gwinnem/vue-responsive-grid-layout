export default {
  '/api/': getApiSidebar(),
  '/components/': getComponentsSidebar(),
  '/guide/': getGuideSidebar(),
  '/examples/': getExamplesSidebar(),
};

function getApiSidebar() {
  return [
    {
      text: 'Features',
      collapsible: true,
      items: [
        {
          text: 'API',
          link: '/api/',
        },
      ],
    },
  ];
}

function getComponentsSidebar() {
  return [
    {
      text: 'Components',
      collapsible: true,
      items: [
        {
          text: 'GridLayout',
          link: '/components/grid-layout',
        },
        {
          text: 'GridItem',
          link: '/components/grid-item',
        },
      ],
    },
    {
      text: 'Properties',
      collapsible: true,
      collapsed: false,
      items: [
        {
          text: 'GridLayout Props',
          link: '/components/grid-layout-props'
        },
        {
          text: 'GridItem Props',
          link: '/components/grid-item-props'
        },
      ],
    },
    {
      text: 'Events',
      collapsible: true,
      collapsed: false,
      items: [
        {
          text: 'GridLayout Events',
          link: '/components/grid-layout-events'
        },
        {
          text: 'GridItem Events',
          link: '/components/grid-item-events'
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
