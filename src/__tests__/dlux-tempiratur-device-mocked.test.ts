import { DluxTempiraturDevice } from "../index";
import CallbackMock from "./CallbackMock.test";
import MqttClientMock from "./MqttClientMock.test";

const client = new MqttClientMock();
const tMock = new CallbackMock();
const xMock = new CallbackMock();

const d = new DluxTempiraturDevice({
  name: "device",
  topic: "dlux/pi",
  callbacks: {
    temperatures: tMock.mock,
    text: xMock.mock,
  },
});
d.initialize(client);

test("mocked client inital publishes", () => {
  expect(client.publishes).toHaveLength(0);
});

test("mocked client inital subscriptions", () => {
  expect(client.subscriptions).toHaveLength(6);
  expect(client.subscriptions).toEqual(["dlux/pi/status", "dlux/pi/version", "dlux/pi/inputs", "dlux/pi/outputs", "dlux/pi/temps", "dlux/pi/text/+"]);
});

test("mocked client inital listeners", () => {
  expect(client.listeners).toHaveLength(1);
});

test("dlux tempiratur device mocked temperatures", () => {
  expect(tMock.calls).toHaveLength(0);
  expect(d.temperatures).toEqual([]);
  client.mock("dlux/pi/temps", Buffer.from("a:2.1,b:2.2,c:5.6"));
  const temps = [2.1, 2.2, 5.6];
  const average = 3.3;
  expect(d.temperatures).toEqual(temps);
  expect(d.average).toEqual(average);
  expect(tMock.calls).toEqual([[average, temps]]);
});

test("dlux tempiratur device mocked text", () => {
  expect(xMock.calls).toHaveLength(0);
  expect(d.text).toEqual({});
  client.mock("dlux/pi/text/1", Buffer.from("AAA"));
  client.mock("dlux/pi/text/2", Buffer.from("BBB"));
  client.mock("dlux/pi/text/10", Buffer.from("CCC"));
  client.mock("dlux/pi/text/2", Buffer.from("DDD"));
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

test("mocked client state after tests", () => {
  expect(client.publishes).toHaveLength(0);
  expect(client.subscriptions).toHaveLength(6);
  expect(client.listeners).toHaveLength(1);
  expect(tMock.calls).toHaveLength(1);
  expect(xMock.calls).toHaveLength(4);
});
