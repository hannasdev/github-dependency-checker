export class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  emit(eventName, data) {
    const event = this.events[eventName];
    if (event) {
      event.forEach((callback) => callback(data));
    }
  }
}

export const eventEmitter = new EventEmitter();
