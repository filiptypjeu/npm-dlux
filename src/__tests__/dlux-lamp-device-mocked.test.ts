import { DluxLampDevice } from "../index";
import { DluxLampCommand } from "../lamp/enums";
import { MqttClientMock } from "./MqttClientMock.test";

const client = new MqttClientMock();

const d = new DluxLampDevice({
  name: "device",
  topic: "dlux/gt",
});
d.initialize(client);

test("mocked client inital publishes", () => {
  expect(client.publishes).toHaveLength(1);
  expect(client.publishes).toEqual([{ topic: "dlux/gt", payload: "v" }]);
});

test("mocked client inital subscriptions", () => {
  expect(client.subscriptions).toHaveLength(6);
  expect(client.subscriptions).toEqual(["dlux/gt/status", "dlux/gt/version", "dlux/gt/log", "dlux/gt/inputs", "dlux/gt/outputs", "dlux/gt/lamps"]);
});

test("mocked client inital listeners", () => {
  expect(client.listeners).toHaveLength(1);
});

test("dlux lamp device mocked lamp states", () => {
  expect(d.lamps).toEqual("");
  client.mock("dlux/gt/lamps", Buffer.from("1-1-0"));
  expect(d.lamps).toEqual("1-1-0");
});

test("dlux lamp device mocked set one lamp", () => {
  d.setLamp({ index: 0, state: DluxLampCommand.ON });
  expect(client.lastPublish).toEqual({ topic: "dlux/gt/l/1", payload: "1" });
  d.setLamp({ index: 1, state: DluxLampCommand.OFF });
  expect(client.lastPublish).toEqual({ topic: "dlux/gt/l/2", payload: "0" });
  d.setLamp({ index: 41, state: DluxLampCommand.TOGGLE });
  expect(client.lastPublish).toEqual({ topic: "dlux/gt/l/42", payload: "T" });
  d.setLamp({ index: 68, state: DluxLampCommand.NO_CHANGE });
  expect(client.lastPublish).toEqual({ topic: "dlux/gt/l/69", payload: "-" });
});

test("dlux lamp device mocked set lamps", () => {
  d.setLamps([{ index: 0, state: DluxLampCommand.ON }]);
  expect(client.lastPublish).toEqual({ topic: "dlux/gt/l/1", payload: "1" });
  d.setLamps([
    { index: 1, state: DluxLampCommand.ON },
    { index: 3, state: DluxLampCommand.TOGGLE },
    { index: 5, state: DluxLampCommand.OFF },
  ]);
  expect(client.lastPublish).toEqual({ topic: "dlux/gt/l", payload: "-1-T-0" });
});

test("dlux lamp device mocked set lamps invalid indexes", () => {
  expect(client.publishes).toHaveLength(7);
  d.setLamp({ index: -2, state: DluxLampCommand.ON });
  d.setLamps([
    { index: -2, state: DluxLampCommand.ON },
    { index: -3, state: DluxLampCommand.ON },
  ]);
  expect(client.publishes).toHaveLength(7);
});

test("mocked client state after tests", () => {
  expect(client.publishes).toHaveLength(7);
  expect(client.subscriptions).toHaveLength(6);
  expect(client.listeners).toHaveLength(1);
});
