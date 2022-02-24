import { DluxEventSource, DluxMqttDevice, IDluxEvent } from "../index";
import { MqttClientMock } from "./MqttClientMock.test";

const client = new MqttClientMock();

const events: IDluxEvent[] = [];

const d = new DluxMqttDevice({
  name: "device",
  topic: "dlux/l1",
  eventCallback: (e: IDluxEvent) => events.push(e),
  client
});

test("mocked client inital publishes", () => {
  expect(client.publishes).toHaveLength(0);
});

test("mocked client inital subscriptions", () => {
  expect(client.subscriptions).toHaveLength(5);
  expect(client.subscriptions).toEqual(["dlux/l1/status", "dlux/l1/version", "dlux/l1/inputs", "dlux/l1/outputs", "dlux/l1/events"]);
});

test("mocked client inital listeners", () => {
  expect(client.listeners).toHaveLength(1);
});

test("dlux mqtt device mocked status topic", () => {
  expect(d.online).toEqual(false);
  expect(d.status).toEqual("offline");
  client.mock("dlux/l1/status", Buffer.from("online"));
  expect(d.online).toEqual(true);
  expect(d.status).toEqual("online");
  client.mock("dlux/l1/status", Buffer.from("disconnected"));
  expect(d.online).toEqual(false);
  expect(d.status).toEqual("disconnected");
});

test("dlux mqtt device mocked version topic", () => {
  expect(d.version).toEqual("");
  client.mock("dlux/l1/version", Buffer.from("v.1.2"));
  expect(d.version).toEqual("v.1.2");
  client.mock("dlux/l1/version", Buffer.from("v.1.3"));
  expect(d.version).toEqual("v.1.3");
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
  client.mock("dlux/l1/events", Buffer.from("D:13:1"));
  expect(events).toHaveLength(1);
  client.mock("dlux/l1/events", Buffer.from("I:5:0"));
  expect(events).toHaveLength(2);
  client.mock("dlux/l1/events", Buffer.from("a:a:a:a"));
  expect(events).toHaveLength(3);
  expect(events).toEqual([
    {
      source: DluxEventSource.DLUX_BUTTON,
      n: 13,
      value: 1,
    },
    {
      source: DluxEventSource.GPIO_INPUT,
      n: 5,
      value: 0,
    },
    {
      source: "a",
      n: NaN,
      value: NaN,
    },
  ]);
});

test("mocked client state after tests", () => {
  expect(client.publishes).toHaveLength(0);
  expect(client.subscriptions).toHaveLength(5);
  expect(client.listeners).toHaveLength(1);
});
