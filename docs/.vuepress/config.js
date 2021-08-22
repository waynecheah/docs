const { navbarConfig, sidebarConfig } = require('vuepress-theme-hope')
const { description } = require('../../package')

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Documentation',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  theme: 'vuepress-theme-hope',

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    author: 'Wayne',
    hostname: 'localhost',
    repo: 'https://github.com/waynecheah/docs',
    repoLabel: 'Github',
    editLinks: true,
    docsDir: 'docs',
    editLinkText: '',
    logo: '',
    lastUpdated: true,
    // themeColor: {
    //   blue: '#2196f3',
    //   orange: '#dc9f00'
    // },
    mdEnhance: {
      flowchart: true,
      mark: true,
      mermaid: true,
      tasklist: true
    },
    copyright: {
      status: 'local',
    },
    nav: navbarConfig([
      {
        text: 'Docs Guide',
        link: '/guide/',
      },
      {
        text: 'Kubernetes',
        link: '/k8s/'
      },
      {
        text: 'Raspberry Pi',
        link: '/raspi/',
        icon: 'info',
        items: [
        ]
      },
      {
        text: 'About Me',
        link: 'https://kokweng.net'
      }
    ]),
    sidebar: sidebarConfig({
      '/config/': [
        {
          title: 'ThemeConfig',
          icon: 'config',
          prefix: 'theme/',
          collapsable: false,
          children: [
            '',
            'default',
            'feature',
            'plugin',
            'apperance'
          ],
        },
        'page',
        'stylus',
        'i18n',
        {
          title: 'Plugins',
          icon: 'plugin',
          prefix: 'plugin/',
          collapsable: false,
          children: [
            '',
            'container',
            'copyright'
          ],
        },
      ],

      '/guide/': [
        {
          title: 'Get Started',
          icon: 'creative',
          prefix: 'get-started/',
          collapsable: false,
          children: [
            'install',
            'markdown'
          ]
        },
        {
          title: 'Basic',
          icon: 'module',
          prefix: 'basic/',
          collapsable: false,
          children: [
            'tutorial',
            {
              title: 'Markdown',
              icon: 'markdown',
              prefix: 'markdown/',
              collapsable: false,
              children: [
                '',
                'demo',
                {
                  title: 'Emoji',
                  icon: 'emoji',
                  path: 'emoji/',
                  prefix: 'emoji/',
                  collapsable: false,
                  children: ['people', 'nature', 'object', 'place', 'symbol']
                },
              ]
            }
          ]
        },
        {
          title: 'Layout',
          icon: 'layout',
          prefix: 'layout/',
          collapsable: false,
          children: [
            'navbar',
            'sidebar',
            {
              title: 'Page',
              icon: 'page',
              collapsable: false,
              children: [
                'page',
                'breadcrumb',
                'footer'
              ],
            },
            'home',
            'slides',
            'custom',
          ]
        },
        {
          title: 'Markdown enhance',
          icon: 'markdown',
          prefix: 'markdown/',
          collapsable: false,
          children: [
            'intro',
            'components',
            'align',
            'sup-sub',
            'footnote',
            'mark',
            'tasklist',
            'tex',
            'flowchart',
            'mermaid',
            'demo',
            'presentation',
            'external',
          ],
        },
        {
          title: 'Features',
          icon: 'discover',
          prefix: 'feature/',
          collapsable: false,
          children: [
            'page-info',
            'comment',
            'copy-code',
            'photo-swipe',
            'copyright',
            'git',
            'encrypt',
            'pwa',
            'feed',
            'seo',
            'sitemap',
            'typescript'
          ],
        }
      ],

      '/k8s/': [
        '',
        'efk'
      ],

      '/raspi/': [
        '',
        'ddns',
        'monitoring',
        'install'
      ],

      '/': [
        '',
        {
          title: 'Docs Guide',
          icon: 'creative',
          prefix: 'guide/',
          collapsable: true,
          children: [
            'get-started/',
            'basic/',
            'layout/',
            'markdown/',
            'feature/'
          ]
        },
        {
          title: 'VuePress Config',
          icon: 'config',
          prefix: 'config/',
          collapsable: true,
          children: [
            '',
            'theme/',
            'page',
            'stylus',
            'i18n',
            'plugin/'
          ]
        },
        {
          title: 'Kubernetes Guide',
          icon: 'config',
          prefix: 'k8s/',
          collapsable: true,
          children: ['', 'efk']
        },
        {
          title: 'Raspberry Pi K3s Setup',
          icon: 'config',
          prefix: 'raspi/',
          collapsable: true,
          children: ['', 'ddns', 'monitoring', 'install']
        }
      ]
    })
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom'
  ]
}
