import { DluxLampDevice } from "../index";

const d = new DluxLampDevice({
  name: "gatan",
  topic: "dlux/gt",
});

test("dlux lamp device basic properties", () => {
  expect(d.name).toEqual("gatan");
  expect(d.topic).toEqual("dlux/gt");
});

const subs = d.subscriptions;

test("dlux lamp device subscriptions", () => {
  expect(subs).toHaveLength(5);
  expect(subs[4].topic).toEqual("dlux/gt/lamps");
});

test("dlux lamp device default lamp states", () => {
  expect(d.lamps).toEqual("");
});

test("dlux lamp device lamp state callback", () => {
  subs[4].callback(Buffer.from("10110010--------"), "");
  expect(d.lamps).toEqual("10110010--------");
});
