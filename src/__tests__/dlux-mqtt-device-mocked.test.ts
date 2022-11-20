import { DluxEventSource, DluxMqttDevice } from "../index";
import MqttClientMock from "./MqttClientMock.test";
import CallbackMock from "./CallbackMock.test";
import { TOPICS_DLUX } from "./VARS";

const client = new MqttClientMock();
const sMock = new CallbackMock();
const eMock = new CallbackMock();
const iMock = new CallbackMock();
const oMock = new CallbackMock();
const tMock = new CallbackMock();
const xMock = new CallbackMock();

const d = new DluxMqttDevice({
  name: "device",
  topic: "dlux/l1",
  callbacks: {
    status: sMock.mock,
    inputs: iMock.mock,
    outputs: oMock.mock,
    events: eMock.mock,
    temperatures: tMock.mock,
    text: xMock.mock,
  },
}).initialize(client);

test("mocked client inital publishes", () => {
  expect(client.publishes).toHaveLength(0);
});

test("mocked client inital subscriptions", () => {
  expect(client.subscriptions).toEqual(TOPICS_DLUX.map(t => `dlux/l1/${t}`));
});

test("mocked client inital listeners", () => {
  expect(client.listeners).toHaveLength(1);
});

test("dlux mqtt device mocked status topic", () => {
  expect(client.publishes).toHaveLength(0);
  expect(sMock.calls).toHaveLength(0);
  expect(d.online).toEqual(false);
  expect(d.status).toEqual("offline");
  client.mock("dlux/l1/status", Buffer.from("online"));
  expect(client.publishes).toEqual([{ topic: "dlux/l1/v", payload: "" }]);
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

test("dlux mqtt device mocked temperatures", () => {
  expect(tMock.calls).toHaveLength(0);
  expect(d.temperatures).toEqual([]);
  const raw = "a:2.1,b:2.2,c:5.6";
  client.mock("dlux/l1/temps", Buffer.from(raw));
  const temps = [2.1, 2.2, 5.6];
  expect(d.temperatures).toEqual(temps);
  expect(tMock.calls).toEqual([[temps, raw]]);
});

test("dlux mqtt device mocked text", () => {
  expect(xMock.calls).toHaveLength(0);
  expect(d.text).toEqual({});
  client.mock("dlux/l1/text/1", Buffer.from("AAA"));
  client.mock("dlux/l1/text/2", Buffer.from("BBB"));
  client.mock("dlux/l1/text/10", Buffer.from("CCC"));
  client.mock("dlux/l1/text/2", Buffer.from("DDD"));
  expect(d.text).toEqual({
    1: "AAA",
    2: "DDD",
    10: "CCC",
  });
  expect(xMock.calls).toEqual([
    [1, "AAA"],
    [2, "BBB"],
    [10, "CCC"],
    [2, "DDD"],
  ]);
});

test("dlux mqtt device mocked variables", () => {
  client.mock("dlux/l1/log", Buffer.from("[l1] Variable 10: my_var = 15 (10 | 10101010)"));
  client.mock("dlux/l1/log", Buffer.from("[l1] Variable 5: my_other_var = 123 (155 | 00000000)"));
  expect(d.variables).toEqual([{
    index: 10,
    name: "my_var",
    value: 15,
    defaultValue: 10,
  }, {
    index: 5,
    name: "my_other_var",
    value: 123,
    defaultValue: 155,
    }]);

    client.mock("dlux/l1/log", Buffer.from("[l1] Variable 5: my_var = 0 (1 | 10101010)"));
    expect(d.variables).toEqual([{
      index: 5,
      name: "my_var",
      value: 0,
      defaultValue: 1,
    }]);

    client.mock("dlux/l1/log", Buffer.from("[l1] Variable 5: my_var = A (B | 10101010)"));
    const V = d.variables;
    expect(V).toEqual([{
      index: 5,
      name: "my_var",
      value: NaN,
      defaultValue: NaN,
    }]);

    client.mock("dlux/l1/log", Buffer.from("[l1] Variable N: my_var = 0 (1 | 10101010)"));
    expect(d.variables).toEqual(V);

    client.mock("dlux/l1/log", Buffer.from("[l1] Variable1: my_var = 0 (1 | 10101010)"));
    expect(d.variables).toEqual(V);

    client.mock("dlux/l1/log", Buffer.from("[l11] Variable 1: my_var = 0 (1 | 10101010)"));
    expect(d.variables).toEqual(V);

    d.setVariable("my_var", 123);
    expect(client.lastPublish).toEqual({ topic: "dlux/l1/v/5", payload: "123" });
    d.setVariable("my_other_var", 321);
    expect(client.lastPublish).toEqual({ topic: "dlux/l1/v/5", payload: "123" });
    d.setVariable(11, 222);
    expect(client.lastPublish).toEqual({ topic: "dlux/l1/v/11", payload: "222" });
});

test("mocked states after tests", () => {
  expect(client.publishes).toHaveLength(3);
  expect(client.subscriptions).toHaveLength(TOPICS_DLUX.length);
  expect(client.listeners).toHaveLength(1);
  expect(sMock.calls).toHaveLength(2);
  expect(eMock.calls).toHaveLength(3);
  expect(iMock.calls).toHaveLength(1);
  expect(oMock.calls).toHaveLength(1);
  expect(tMock.calls).toHaveLength(1);
  expect(xMock.calls).toHaveLength(4);
});
