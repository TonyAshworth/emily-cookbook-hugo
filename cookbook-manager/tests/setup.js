// Jest setup file
// This file runs before all tests

// Mock electron APIs globally
global.mockElectron = {
  app: {
    getPath: jest.fn((type) => {
      if (type === 'userData') return '/mock/user/data';
      return '/mock/app/path';
    }),
    getVersion: jest.fn(() => '1.0.0'),
    quit: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showMessageBox: jest.fn(),
    showErrorBox: jest.fn()
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    webContents: {
      send: jest.fn(),
      openDevTools: jest.fn(),
      on: jest.fn(),
      setWindowOpenHandler: jest.fn()
    },
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn()
  })),
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn()
  }
};

// Mock fs-extra globally
jest.mock('fs-extra', () => ({
  readJson: jest.fn(),
  writeJson: jest.fn(),
  writeJsonSync: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  pathExists: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  remove: jest.fn(),
  ensureDirSync: jest.fn(),
  existsSync: jest.fn()
}));

// Mock electron-log globally
jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  transports: {
    file: {
      level: 'debug',
      maxSize: 5 * 1024 * 1024,
      format: '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}'
    },
    console: {
      level: 'debug'
    }
  }
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
  basename: jest.fn((path, ext) => {
    const name = path.split('/').pop();
    return ext ? name.replace(ext, '') : name;
  }),
  extname: jest.fn((path) => {
    const parts = path.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  })
}));

// Set up console spies to reduce noise in tests
global.consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  info: jest.spyOn(console, 'info').mockImplementation(() => {})
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global teardown
afterAll(() => {
  global.consoleSpy.log.mockRestore();
  global.consoleSpy.error.mockRestore();
  global.consoleSpy.warn.mockRestore();
  global.consoleSpy.info.mockRestore();
});
