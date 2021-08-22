---
home: true
icon: home
title: Home
heroImage: /assets/profile.jpg
heroText: Technical Documentation
tagline: version 1.0
action:
  - text: Get Started 💡
    link: /guide/
    type: primary
  - text: Config 🛠
    link: /config/
features:
  # - title: Kubernetes
  #   details: Auth Microservice that handle all credentials and access control
  - title: Raspberry Pi K3s Setup
    details: Build the self-hosting platform with Raspberry Pi and Kubernetes
    link: /raspi/
  - title: Kubernetes Setup
    details: This is all about the Kubernetes related tooling setup guides
    link: /k8s/

footer: MIT Licensed | Copyright © 2021 Wayne Cheah
copyrightText: false
---

## 🛠 Install
Create a vuepress-theme-hope project in `docs` folder under the current project:

<CodeGroup>
  <CodeGroupItem title="npm">
  ```bash
  npm init vuepress-theme-hope docs
  ```
  </CodeGroupItem>

  <CodeGroupItem title="yarn">
  ```bash
  yarn create vuepress-theme-hope docs
  ```
  </CodeGroupItem>
</CodeGroup>

## 🚀 Usage
```js{2,4,6}
// .vuepress/config.js
const { config } = require("vuepress-theme-hope");

module.exports = config({
  // your config here
});
```

::: tip
`config` is just a helper function, it will give you config description and provide auto-completion through TS’s Interface and JSDoc.

At the same time, the `config` function will also complete some default configurations for your current configuration which will pass directly to VuePress.

Don’t worry it will change your config! It will respect every config you make to make sure your other plugins work well.

You can view [Config of this site][docs-config] as an example.
:::

[docs-config]: https://github.com/vuepress-theme-hope/vuepress-theme-hope/blob/v1/docs/theme/src/.vuepress/config.js
