// Web shim for @react-native-async-storage/async-storage using localStorage
const AsyncStorageWeb = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
  removeItem: (key) => { localStorage.removeItem(key); return Promise.resolve(); },
  multiRemove: (keys) => { keys.forEach(k => localStorage.removeItem(k)); return Promise.resolve(); },
  clear: () => { localStorage.clear(); return Promise.resolve(); },
  getAllKeys: () => Promise.resolve(Object.keys(localStorage)),
  multiGet: (keys) => Promise.resolve(keys.map(k => [k, localStorage.getItem(k)])),
  multiSet: (pairs) => { pairs.forEach(([k, v]) => localStorage.setItem(k, v)); return Promise.resolve(); },
};

export default AsyncStorageWeb;
