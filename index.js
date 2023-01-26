const path = require('path');
const { RawSource } = require('webpack-sources');
const postcss = require('postcss');
const purge = require('./purge.js');

function Plugin(options) {
}

function getFormattedFilename(fileName) {
  if (fileName.includes('?')) {
    return fileName.split('?').slice(0, -1).join('');
  }
  return fileName;
}

function isFileOfTypes(filename, extensions) {
  const extension = path.extname(getFormattedFilename(filename));
  return extensions.includes(extension);
}

Plugin.prototype.apply = function(compiler) {
  // 所有文件资源都被 loader 处理后触发这个事件
  compiler.hooks.emit.tapAsync('PurgeCssPlugin', async (compilation, callback) => {
    // 功能完成后调用 webpack 提供的回调
    const assetsFromCompilation = Object.entries(compilation.assets).filter(
      ([name]) => {
        return isFileOfTypes(name, ['.wxml']);
      },
    );

    for (const [name, asset] of assetsFromCompilation) {
      const wxml = asset.source().toString();
      const cssFilename = name.replace('.wxml', '.wxss');
      if (compilation.assets[cssFilename]) {
        const css = compilation.assets[cssFilename].source().toString();
        const purgeCssResult = await postcss([purge({
          wxml: wxml,
        })]).process(css);
        compilation.updateAsset(
          cssFilename,
          new RawSource(purgeCssResult.css),
        );
      }
    }
    callback();
  });
};

module.exports = Plugin;