import { DluxLampDevice } from "../mqtt/DluxLampDevice";

const d = new DluxLampDevice({
  name: "gatan",
  topic: "dlux/gt",
});

test("dlux lamp device basic properties", () => {
  expect(d.name).toEqual("gatan");
  expect(d.topic).toEqual("dlux/gt");
  expect(d.statesTopic).toEqual("dlux/gt/states");
  expect(d.lampTopic).toEqual("dlux/gt/l");
});

const subs = d.subscriptions;

test("dlux lamp device subscriptions", () => {
  expect(subs).toHaveLength(6);
  expect(subs[5].topic).toEqual("dlux/gt/states");
});

test("dlux lamp device default state", () => {
  expect(d.state).toEqual("");
});

test("dlux lamp device state callback", () => {
  subs[5].callback(Buffer.from("10110010--------"));
  expect(d.state).toEqual("10110010--------");
});
