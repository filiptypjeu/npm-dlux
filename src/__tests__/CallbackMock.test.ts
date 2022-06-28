type Callback = (...args: any[]) => void;

class CallbackMock {
  public calls: any[] = [];

  constructor() {}

  public get lastCall(): void {
    const n = this.calls.length;
    if (n === 0) {
      throw new Error("No calls found");
    }
    return this.calls[n - 1];
  }

  public get mock(): Callback {
    return (...args: any[]) => {
      this.calls.push(args);
    };
  }
}

export default CallbackMock;

const cb = new CallbackMock();

test("CallbackMock initial state", () => {
  expect(cb).toBeTruthy();
  expect(cb.calls).toHaveLength(0);
});

test("CallbackMock mock", () => {
  expect(() => cb.lastCall).toThrow();
  cb.mock("test1", "abc");
  expect(cb.calls).toHaveLength(1);
  cb.mock("test2", "def");
  expect(cb.calls).toHaveLength(2);
  expect(cb.calls[0]).toEqual(["test1", "abc"]);
  expect(cb.calls[1]).toEqual(["test2", "def"]);
  expect(cb.lastCall).toEqual(["test2", "def"]);
});
