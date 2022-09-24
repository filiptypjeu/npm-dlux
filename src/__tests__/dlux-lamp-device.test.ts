import { DluxLampDevice } from "../index";
import { TOPICS_LAMP } from "./VARS";

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
  expect(subs.map(s => s.topic)).toEqual(TOPICS_LAMP.map(t => `dlux/gt/${t}`));
});

test("dlux lamp device default lamp states", () => {
  expect(d.lamps).toEqual("");
});

test("dlux lamp device lamp state callback", () => {
  subs.find(s => s.topic.includes("lamps"))!.callback(Buffer.from("10110010--------"), "");
  expect(d.lamps).toEqual("10110010--------");
});
