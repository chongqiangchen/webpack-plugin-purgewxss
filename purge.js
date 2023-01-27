const fs = require('fs');
const selectorParser = require('postcss-selector-parser');
const WXMLParser = require('./parseWxml.js');

const wxmlExtractor = (content, extractInfo) => {
  const parser = new WXMLParser({
    onopentag: (tagname, attrs) => {
      extractInfo.tag.push(tagname);
      if (attrs) {
        // find ids
        const ids = attrs.filter(attr => attr.key === 'id');
        const idValues = ids.map(id => id.value);
        extractInfo.id = extractInfo.id.concat(idValues);

        // find classes
        const classes = attrs.filter(attr => attr.key && (attr.key === 'class' || attr.key.includes('-class')));
        const classValues = flatten(classes.map(cls => cls.value.split(' ')));
        extractInfo.class = extractInfo.class.concat(classValues);
      }
    }
  });
  parser.write(content);
  // 过滤掉空值
  extractInfo.id = extractInfo.id.filter(Boolean);
  extractInfo.class = extractInfo.class.filter(Boolean);
  extractInfo.tag = extractInfo.tag.filter(Boolean);
}

const hasDynamicClass = (classes) => {
  return classes.some(cls => cls.includes('{{'));
}

const transformSelector = (selectors, extractInfo) => {
  if (hasDynamicClass(extractInfo.class)) {
    return;
  }
  
  selectors.walk(selector => {
    selector.nodes && selector.nodes.forEach(selectorNode => {
      let shouldRemove = false;
      switch(selectorNode.type) {
        case 'tag':
          const isKeyframesKeywords = /^\d+(\.\d+)?%$/.test(selectorNode.value) || selectorNode.value === 'from' || selectorNode.value === 'to';
          if (!isKeyframesKeywords && extractInfo.tag.indexOf(selectorNode.value) === -1) {
            shouldRemove = true;
          }
          break;
        case 'class':
          if (extractInfo.class.indexOf(selectorNode.value) === -1) {
            shouldRemove = true;
          }
          break;
        case 'id':
          if (extractInfo.id.indexOf(selectorNode.value) === -1) {
            shouldRemove = true;
          }
          break;
      }

      if(shouldRemove) {
        selectorNode.remove();
      }
    });
  });
};

function flatten(ary) {
  return ary.reduce((pre, cur) => {
    return pre.concat(Array.isArray(cur) ? flatten(cur) : cur);
  }, []);
}

const purgePlugin = (options) => {
  const extractInfo = {
    id: [],
    class: [],
    tag: []
  };

  wxmlExtractor(options && options.wxml, extractInfo)

  extractInfo.tag.push('page');
  extractInfo.tag.push('component');
  extractInfo.tag.push('image');
  extractInfo.tag.push('video');
  
  return {
    postcssPlugin: 'postcss-purge',
    Rule (rule) {
      const newSelector = rule.selector.split(',').map(item => {
        const transformed = selectorParser((selectors) => transformSelector(selectors, extractInfo)).processSync(item);
        return transformed !== item ? '' : item;
      }).filter(Boolean).join(',');

      if(newSelector === '') {
        rule.remove();
      } else {
        rule.selector = newSelector;
      }
    }
  }
}

module.exports = purgePlugin;