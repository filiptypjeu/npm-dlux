import { DluxLedDevice } from "../mqtt/DluxLedDevice";
import { DluxLedMultiDevice } from "../mqtt/DluxLedMultiDevice";

const d1 = new DluxLedDevice("D1", "dlux/l1");
const d2 = new DluxLedDevice("D2", "dlux/l2");
const d = new DluxLedMultiDevice("ALL", [d1, d2]);

test("dlux led multi device basic properties", () => {
  expect(d.name).toEqual("ALL");
  expect(() => d.state).toThrow();
  expect(() => d.topic).toThrow();
  expect(() => d.statusTopic).toThrow();
  expect(() => d.versionTopic).toThrow();
  expect(() => d.logTopic).toThrow();
  expect(() => d.inputsTopic).toThrow();
  expect(() => d.outputsTopic).toThrow();
  expect(() => d.statesTopic).toThrow();
  expect(() => d.actionTopic).toThrow();
  expect(() => d.sceneTopic).toThrow();
});

test("dlux led multi device subscriptions", () => {
  expect(d.subscriptions).toHaveLength(0);
});

test("dlux led multi device online", () => {
  expect(d.online).toEqual(false);
  d1.subscriptions[0].callback(Buffer.from("online"));
  expect(d.online).toEqual(true);
});
