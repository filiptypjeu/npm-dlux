import { DluxEventSource, DluxMqttDevice } from "../index";
import MqttClientMock from "./MqttClientMock.test";
import CallbackMock from "./CallbackMock.test";

const client = new MqttClientMock();
const sMock = new CallbackMock();
const eMock = new CallbackMock();
const iMock = new CallbackMock();
const oMock = new CallbackMock();

const d = new DluxMqttDevice({
  name: "device",
  topic: "dlux/l1",
  callbacks: {
    status: sMock.mock,
    inputs: iMock.mock,
    outputs: oMock.mock,
    events: eMock.mock,
  },
}).initialize(client);

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
  expect(sMock.calls).toHaveLength(0);
  expect(d.online).toEqual(false);
  expect(d.status).toEqual("offline");
  client.mock("dlux/l1/status", Buffer.from("online"));
  expect(d.online).toEqual(true);
  expect(d.status).toEqual("online");
  client.mock("dlux/l1/status", Buffer.from("disconnected"));
  expect(d.online).toEqual(false);
  expect(d.status).toEqual("disconnected");
  expect(sMock.calls).toEqual([["online"], ["disconnected"]]);
});

test("dlux mqtt device mocked version topic", () => {
  expect(d.version).toEqual("");
  client.mock("dlux/l1/version", Buffer.from("v.1.2"));
  expect(d.version).toEqual("v.1.2");
  client.mock("dlux/l1/version", Buffer.from("v.1.3"));
  expect(d.version).toEqual("v.1.3");
});

test("dlux mqtt device mocked inputs topic", () => {
  expect(iMock.calls).toHaveLength(0);
  client.mock("dlux/l1/inputs", Buffer.from("011:1:-:0"));
  const inputs = [11, true, undefined, false, undefined, undefined, undefined, undefined];
  expect(d.inputs).toEqual(inputs);
  expect(iMock.calls).toEqual([[inputs]]);
});

test("dlux mqtt device mocked outputs topic", () => {
  expect(oMock.calls).toHaveLength(0);
  client.mock("dlux/l1/outputs", Buffer.from("-10"));
  const outputs = [undefined, true, false, undefined, undefined, undefined, undefined, undefined];
  expect(d.outputs).toEqual(outputs);
  expect(oMock.calls).toEqual([[outputs]]);
});

test("dlux mqtt device mocked event", () => {
  expect(eMock.calls).toHaveLength(0);
  client.mock("dlux/l1/events", Buffer.from("D:13:1"));
  client.mock("dlux/l1/events", Buffer.from("I:5:0"));
  client.mock("dlux/l1/events", Buffer.from("a:a:a:a"));
  expect(eMock.calls).toEqual([
    [
      {
        source: DluxEventSource.DLUX_BUTTON,
        n: 13,
        value: 1,
      },
    ],
    [
      {
        source: DluxEventSource.GPIO_INPUT,
        n: 5,
        value: 0,
      },
    ],
    [
      {
        source: "a",
        n: NaN,
        value: NaN,
      },
    ],
  ]);
});

test("mocked states after tests", () => {
  expect(client.publishes).toHaveLength(0);
  expect(client.subscriptions).toHaveLength(5);
  expect(client.listeners).toHaveLength(1);
  expect(sMock.calls).toHaveLength(2);
  expect(eMock.calls).toHaveLength(3);
  expect(iMock.calls).toHaveLength(1);
  expect(oMock.calls).toHaveLength(1);
});
