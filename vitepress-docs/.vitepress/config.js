import { defineConfig } from 'vitepress';
import nav from './configs/nav';
import sidebar from './configs/sidebar';

export default defineConfig({
  lang: 'en-US',
  title: 'Home',
  description: 'Documentation for vue-responsive-grid-layout component',
  appearance: true,
  lastUpdated: true,
  cleanUrls: 'true',

  base: process.env.BASE || '/',
  head: [['link', {
    rel: 'icon',
    type: 'image/svg+xml',
    href: '/Data Grid.svg'
  }]],
  // locales: {
  //   root: {
  //     label: 'English',
  //     lang: 'en',
  //     selectText: 'Languages',
  //   },
  //   fr: {
  //     label: 'French',
  //     lang: 'fr',
  //     link: '/fr/index',
  //     selectText: 'Languages',
  //
  //     // other locale specific properties...
  //   }
  // },

  markdown: {
    headers: {
      level: [0, 0],
    },

    // options for markdown-it-anchor
    anchor: { permalink: false },

    // options for markdown-it-toc
    toc: { includeLevel: [1, 2, 3] },

    // theme: {
    //   light: 'github-light',
    //   dark: 'github-dark'
    // },
    lineNumbers: true,
  },

  themeConfig: {
    i18nRouting: true,
    logo: '/Data Grid.svg',
    lastUpdatedText: 'Updated',

    // algolia: {
    //   appId: '',
    //   apiKey: '',
    //   indexName: 'vue-ts-responsive-grid-layout',
    // },

    // nav
    nav,

    // sidebar
    sidebar,

    // editLink: {
    //   pattern: 'https://github.com/gwinnem/admin-dashboard/edit/main/docs/:path',
    //   text: 'Edit this page on GitHub',
    // },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/gwinnem/vue-responsive-grid-layout'
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/gwinnem'
      },
      {
        icon: 'linkedin',
        link: 'https://www.linkedin.com/in/gwinnem/'
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M5 6a.4.4 0 0 0-.38.62l2 3.38l-3.06 5.4a.45.45 0 0 0 0 .45a.43.43 0 0 0 .38.19h2.87a.89.89 0 0 0 .79-.55s3-5.31 3.11-5.51l-2-3.46A.91.91 0 0 0 7.92 6zm12.16-4a.84.84 0 0 0-.77.55L10 13.93l4.09 7.52a.91.91 0 0 0 .81.55h2.88a.43.43 0 0 0 .38-.18a.45.45 0 0 0 0-.45l-4.07-7.43l6.36-11.31a.45.45 0 0 0 0-.45a.44.44 0 0 0-.38-.18z"/></svg>'
        },
        link: 'https://www.xing.com/profile/Geirr_Winnem/cv'
      },
      {
        icon: {
          svg: '<svg viewBox="0 0 2500 2500" xmlns="http://www.w3.org/2000/svg" width="2500" height="2500"><path d="M0 0h2500v2500H0z" fill="#c00"/><path d="M1241.5 268.5h-973v1962.9h972.9V763.5h495v1467.9h495V268.5z" fill="#fff"/></svg>'
        },
        link: 'https://www.npmjs.com/package/vue-ts-responsive-grid-layout?activeTab=readme'
      }
    ],

    footer: {
      license: {
        text: 'MIT License',
        link: 'https://opensource.org/licenses/MIT'
      },
      copyright: `Copyright © 2022-${new Date().getFullYear()} Geirr Winnem`
    }
  },

  vite: {
    server: {
      host: true,
      port: 9091,
    },
    json: {
      stringify: true,
    },
  },
});
