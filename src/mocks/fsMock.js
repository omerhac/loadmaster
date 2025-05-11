// src/mocks/fsMock.js
module.exports = {
  readFileSync: () => '',
  writeFileSync: () => {},
  existsSync: () => false,
  unlinkSync: () => {},
  readdirSync: () => [],
  statSync: () => ({
    isDirectory: () => false,
    isFile: () => false,
  }),
  mkdirSync: () => {},
  promises: {
    readFile: async () => '',
    writeFile: async () => {},
    unlink: async () => {},
    mkdir: async () => {},
    readdir: async () => [],
  },
};
