const fs = require('fs');
const path = require('path');
const visit = require('unist-util-visit');
const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const lineExtractor = (fromLine, hasDash, toLine) => content => {
  if (fromLine === undefined && toLine === undefined) {
    return content;
  }
  const lines = content.split(/\r\n|\n/);
  toLine = !toLine && hasDash ? lines.length - 1 : toLine || fromLine;
  fromLine = fromLine || 1;
  return lines.slice(fromLine - 1, toLine).join('\n');
};

const tagExtractor = tag => content => {
  if (!tag) {
    return content;
  }
  content = content.replace(/\r\n/g, '\n');
  tag = escapeRegExp(tag);
  const regex = new RegExp(
    `\\[\\[start:${tag}\\]\\].*\\n(?<content>(.|\\n)+)(?=\\n.*\\[\\[end:${tag}\\]\\])`
  );
  const result = regex.exec(content);
  if (!result || !result.groups || !result.groups.content) {
    throw new Error(`unable to find tag '${tag}' in file`);
  }
  return result.groups.content;
};

function codeImport(options = {}) {
  return function transformer(tree, file) {
    const codes = [];
    const promises = [];

    visit(tree, 'code', (node, index, parent) => {
      codes.push([node, index, parent]);
    });

    for (const [node] of codes) {
      const fileMeta = (node.meta || '')
        .split(' ')
        .find(meta => meta.startsWith('file='));

      if (!fileMeta) {
        continue;
      }

      //const res = /^file=(?<path>.+?)(?:(?:#(?:L(?<from>\d+)(?<dash>-)?)?)(?:L(?<to>\d+))?)?$/.exec(
      const res = /^file=(?<path>.+?)(?:(?:(?:#(?:L(?<from>\d+)(?<dash>-)?)?)(?:L(?<to>\d+))?)?|(?:#\[(?<tag>.*)\]))?$/.exec(
        fileMeta
      );
      if (!res || !res.groups || !res.groups.path) {
        throw new Error(`Unable to parse file path ${fileMeta}`);
      }
      const filePath = res.groups.path;

      const tag = res.groups.tag;
      const hasDash = !!res.groups.dash;
      const fromLine = res.groups.from ? parseInt(res.groups.from) : undefined;
      const toLine = res.groups.to ? parseInt(res.groups.to) : undefined;
      const fileAbsPath = path.resolve(file.dirname, filePath);
      const extractor = tag
        ? tagExtractor(tag)
        : lineExtractor(fromLine, hasDash, toLine);

      if (options.async) {
        promises.push(
          new Promise((resolve, reject) => {
            fs.readFile(fileAbsPath, 'utf8', (err, fileContent) => {
              if (err) {
                reject(err);
                return;
              }

              node.value = extractor(fileContent).trim();
              resolve();
            });
          })
        );
      } else {
        const fileContent = fs.readFileSync(fileAbsPath, 'utf8');

        node.value = extractor(fileContent).trim();
      }
    }

    if (promises.length) {
      return Promise.all(promises);
    }
  };
}

module.exports = codeImport;
