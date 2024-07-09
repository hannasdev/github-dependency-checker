import { EventEmitter } from "../src/utils/eventEmitter";

describe("EventEmitter", () => {
  let eventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
  });

  test("should add event listener", () => {
    const callback = jest.fn();
    eventEmitter.on("testEvent", callback);
    expect(eventEmitter.events["testEvent"]).toContain(callback);
  });

  test("should emit event and call listeners", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    eventEmitter.on("testEvent", callback1);
    eventEmitter.on("testEvent", callback2);

    eventEmitter.emit("testEvent", "testData");

    expect(callback1).toHaveBeenCalledWith("testData");
    expect(callback2).toHaveBeenCalledWith("testData");
  });

  test("should not call listeners of other events", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    eventEmitter.on("testEvent1", callback1);
    eventEmitter.on("testEvent2", callback2);

    eventEmitter.emit("testEvent1", "testData");

    expect(callback1).toHaveBeenCalledWith("testData");
    expect(callback2).not.toHaveBeenCalled();
  });

  test("should handle emission of event with no listeners", () => {
    expect(() => {
      eventEmitter.emit("nonExistentEvent", "testData");
    }).not.toThrow();
  });

  test("should allow multiple listeners for the same event", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    eventEmitter.on("testEvent", callback1);
    eventEmitter.on("testEvent", callback2);

    eventEmitter.emit("testEvent", "testData");

    expect(callback1).toHaveBeenCalledWith("testData");
    expect(callback2).toHaveBeenCalledWith("testData");
    expect(eventEmitter.events["testEvent"]).toHaveLength(2);
  });
});
