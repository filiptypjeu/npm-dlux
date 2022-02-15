import { DluxEventReason, DluxEventSource, DluxMqttDevice, IDluxEvent } from "../index";
import { MqttClientMock } from "./MqttClientMock.test";

const client = new MqttClientMock();

const events: IDluxEvent[] = [];

const d = new DluxMqttDevice({
  name: "device",
  topic: "dlux/l1",
  eventCallback: (e: IDluxEvent) => events.push(e),
});
d.initialize(client);

test("mocked client inital publishes", () => {
  expect(client.publishes).toHaveLength(1);
  expect(client.publishes).toEqual([{ topic: "dlux/l1", payload: "v" }]);
});

test("mocked client inital subscriptions", () => {
  expect(client.subscriptions).toHaveLength(6);
  expect(client.subscriptions).toEqual([
    "dlux/l1/status",
    "dlux/l1/version",
    "dlux/l1/log",
    "dlux/l1/inputs",
    "dlux/l1/outputs",
    "dlux/l1/events",
  ]);
});

test("mocked client inital listeners", () => {
  expect(client.listeners).toHaveLength(1);
});

test("dlux mqtt device mocked status topic", () => {
  expect(d.online).toEqual(false);
  client.mock("dlux/l1/status", Buffer.from("online"));
  expect(d.online).toEqual(true);
  client.mock("dlux/l1/status", Buffer.from("disconnected"));
  expect(d.online).toEqual(false);
});

test("dlux mqtt device mocked version topic", () => {
  expect(d.version).toEqual("");
  client.mock("dlux/l1/version", Buffer.from("v.1.2"));
  expect(d.version).toEqual("v.1.2");
  client.mock("dlux/l1/version", Buffer.from("v.1.3"));
  expect(d.version).toEqual("v.1.3");
});

test("dlux mqtt device mocked log topic", () => {
  client.mock("dlux/l1/log", Buffer.from("Version = v.1.4"));
  expect(d.version).toEqual("v.1.4");
  client.mock("dlux/l1/log", Buffer.from("Version = v.1.5"));
  expect(d.version).toEqual("v.1.5");
});

test("dlux mqtt device mocked inputs topic", () => {
  expect(d.inputs[0]).toEqual(undefined);
  expect(d.inputs[1]).toEqual(undefined);
  expect(d.inputs[2]).toEqual(undefined);
  expect(d.inputs[3]).toEqual(undefined);
  expect(d.inputs[4]).toEqual(undefined);
  client.mock("dlux/l1/inputs", Buffer.from("011:1:-:0"));
  expect(d.inputs[0]).toEqual(11);
  expect(d.inputs[1]).toEqual(true);
  expect(d.inputs[2]).toEqual(undefined);
  expect(d.inputs[3]).toEqual(false);
  expect(d.inputs[4]).toEqual(undefined);
});

test("dlux mqtt device mocked outputs topic", () => {
  expect(d.outputs[0]).toEqual(undefined);
  expect(d.outputs[1]).toEqual(undefined);
  expect(d.outputs[2]).toEqual(undefined);
  expect(d.outputs[3]).toEqual(undefined);
  client.mock("dlux/l1/outputs", Buffer.from("-10"));
  expect(d.outputs[0]).toEqual(undefined);
  expect(d.outputs[1]).toEqual(true);
  expect(d.outputs[2]).toEqual(false);
  expect(d.outputs[3]).toEqual(undefined);
});

test("dlux mqtt device mocked event", () => {
  expect(events).toHaveLength(0);
  client.mock("dlux/l1/events", Buffer.from("D:13:D"));
  expect(events).toHaveLength(1);
  client.mock("dlux/l1/events", Buffer.from("I:5:R"));
  expect(events).toHaveLength(2);
  client.mock("dlux/l1/events", Buffer.from("a:a:a:a"));
  expect(events).toHaveLength(3);
  expect(events).toEqual([
    {
      source: DluxEventSource.DLUX, n: 13, reason: DluxEventReason.DOWN,
    }, {
      source: DluxEventSource.INPUT, n: 5, reason: DluxEventReason.RISE,
    }, {
      source: undefined, n: undefined, reason: undefined,
    }
  ])
});

test("mocked client state after tests", () => {
  expect(client.publishes).toHaveLength(1);
  expect(client.subscriptions).toHaveLength(6);
  expect(client.listeners).toHaveLength(1);
});