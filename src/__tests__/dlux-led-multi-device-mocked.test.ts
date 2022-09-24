import { DluxLedDevice, DluxLedMultiDevice } from "../index";
import MqttClientMock from "./MqttClientMock.test";
import { TOPICS_LED } from "./VARS"

const client = new MqttClientMock();

const d1 = new DluxLedDevice({ name: "D1", topic: "dlux/l1" }).initialize(client);
const d2 = new DluxLedDevice({ name: "D2", topic: "dlux/l2" }).initialize(client);
const d = new DluxLedMultiDevice("ALL", [d1, d2]).initialize(client);
d;

test("mocked client inital state", () => {
  expect(client.publishes).toHaveLength(0);
  expect(client.subscriptions).toHaveLength(2*TOPICS_LED.length);
  expect(client.listeners).toHaveLength(2);
});

test("mocked client state after tests", () => {
  expect(client.publishes).toHaveLength(0);
  expect(client.subscriptions).toHaveLength(2*TOPICS_LED.length);
  expect(client.listeners).toHaveLength(2);
});
