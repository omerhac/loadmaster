// src/mocks/pathMock.js
module.exports = {
  resolve: (...args) => args.join('/'),
  join: (...args) => args.join('/'),
  dirname: (path) => path.split('/').slice(0, -1).join('/'),
  basename: (path) => path.split('/').pop(),
  extname: (path) => {
    const parts = path.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  },
  normalize: (path) => path,
  isAbsolute: (path) => path.startsWith('/'),
  relative: (from, to) => to,
  parse: (path) => ({
    root: '',
    dir: path.split('/').slice(0, -1).join('/'),
    base: path.split('/').pop(),
    ext: '',
    name: path.split('/').pop().split('.')[0]
  })
}; 