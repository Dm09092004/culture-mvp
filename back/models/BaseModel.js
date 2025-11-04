// In-memory хранилище для демонстрации
class BaseModel {
  constructor() {
    this.data = new Map();
  }

  set(key, value) {
    this.data.set(key, value);
    return value;
  }

  get(key) {
    return this.data.get(key);
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    return this.data.delete(key);
  }
}

export default BaseModel;