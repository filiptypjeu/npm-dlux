import { IDluxMqttClientInternalHandling } from "../index";

interface IPublishMock {
  topic: string;
  payload: string;
}

class MqttClientMock implements IDluxMqttClientInternalHandling {
  public publishes: IPublishMock[] = [];
  public subscriptions: string[] = [];
  public listeners: ((topic: string, payload: Buffer) => void)[] = [];

  constructor() {}

  public get lastPublish(): IPublishMock {
    const n = this.publishes.length;
    if (n === 0) {
      throw new Error("No publishes found");
    }
    return this.publishes[n - 1];
  }

  public publish(topic: string, payload: Buffer | string): void {
    this.publishes.push({ topic, payload: payload.toString() });
  }

  public subscribe(topic: string): void {
    this.subscriptions.push(topic);
  }

  public addListener(_event: "message", callback: (topic: string, payload: Buffer) => void): void {
    this.listeners.push(callback);
  }

  public mock(topic: string, payload: Buffer): void {
    this.listeners.forEach(c => c(topic, payload));
  }
}

export default MqttClientMock;

const client = new MqttClientMock();

test("MqttClientMock initial state", () => {
  expect(client).toBeTruthy();
  expect(client.publishes).toHaveLength(0);
  expect(client.subscriptions).toHaveLength(0);
  expect(client.listeners).toHaveLength(0);
});

test("MqttClientMock publish", () => {
  expect(() => client.lastPublish).toThrow();
  client.publish("test1", "abc");
  expect(client.publishes).toHaveLength(1);
  client.publish("test2", "def");
  expect(client.publishes).toHaveLength(2);
  expect(client.publishes[1]).toEqual({ topic: "test2", payload: "def" });
  expect(client.lastPublish).toEqual({ topic: "test2", payload: "def" });
});

test("MqttClientMock add subscription", () => {
  client.subscribe("test1");
  expect(client.subscriptions).toHaveLength(1);
  client.subscribe("test2");
  expect(client.subscriptions).toHaveLength(2);
  expect(client.subscriptions[1]).toEqual("test2");
});

var a = 0;
var b = "";

test("MqttClientMock add listener", () => {
  client.addListener("message", (t: string) => {
    if (t === "test") a++;
  });
  expect(client.listeners).toHaveLength(1);
  client.addListener("message", (t: string, p: Buffer) => {
    if (t === "hello") b += p.toString();
  });
  expect(client.listeners).toHaveLength(2);
});

test("MqttClientMock mock incoming message", () => {
  client.mock("null", Buffer.from(""));
  expect(a).toEqual(0);
  expect(b).toEqual("");

  client.mock("test", Buffer.from(""));
  expect(a).toEqual(1);
  client.mock("test", Buffer.from("..."));
  expect(a).toEqual(2);
  expect(b).toEqual("");

  client.mock("hello", Buffer.from("a"));
  expect(b).toEqual("a");
  client.mock("hello", Buffer.from("b"));
  expect(b).toEqual("ab");
  expect(a).toEqual(2);
});
