import { defineConfig } from 'vitepress';
import { demoBlockPlugin } from 'vitepress-theme-demoblock';
import nav from './configs/nav';
import sidebar from './configs/sidebar';

export default defineConfig({
  lang: 'en-US',
  title: 'Home',
  description: 'Documentation for vue-fluid-grid-layout component',
  appearance: true,

  lastUpdated: true,
  cleanUrls: 'without-subfolders',

  base: process.env.BASE || '/',
  head: [['link', {
    rel: 'icon',
    type: 'image/svg+xml',
    href: '/logo.svg'
  }]],

  markdown: {
    headers: {
      level: [0, 0],
    },

    // options for markdown-it-anchor
    anchor: { permalink: false },

    // options for markdown-it-toc
    toc: { includeLevel: [1, 2, 3] },

    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: false,

    config: (md) => {
      md.use(demoBlockPlugin, {
        cssPreprocessor: 'sass',
      });
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    lastUpdatedText: 'Updated',
    // algolia: {
    //   appId: 'X51HWTCQJJ',
    //   apiKey: 'ca20f15eb8a667898b65d13f4213ae3d',
    //   indexName: 'vitepress-demo',
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
        link: 'https://github.com/gwinnem/admin-dashboard'
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
      }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present Geirr Winnem',
    },
  },
});
