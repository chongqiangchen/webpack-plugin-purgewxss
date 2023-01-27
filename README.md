## Webpack Plugin PurgeWxss

### 支持情况
因项目较老，暂时只考虑到Taro2.x版本，插件本身仅对编译后的WXML和对应的WXSS进行检查，故实际未与Taro产生强关联，但暂时只在Taro中尝试进行使用。

### 介绍

全局引入的样式会造成打包时每个样式文件都存在，但是实际很多组件和页面未使用到，故书写该插件以降低部分打包体积。

### 使用
```
 const PurgeWxssPlugin = require('webpack-plugin-purgewxss');

 // config.js
 mini: {
    postcss: {
    },
    webpackChain(chain) {
      // ...
      chain.plugin('PurgeWxssPlugin').use(PurgeWxssPlugin);
    },
 }
```

### 待解决
- [ ] 1. 由于emit事件得到的编译后代码无法获知部分动态生成的class，类似`{{anonymousState__temp}}`，所以暂定文件内只要存在动态class统一不做处理。（有较好的解决方案期望告知~）