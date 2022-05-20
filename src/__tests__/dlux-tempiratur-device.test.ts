import { DluxTempiraturDevice } from "../index";

const d = new DluxTempiraturDevice({
  name: "pi",
  topic: "dlux/pi",
});

test("dlux tempiratur device basic properties", () => {
  expect(d.name).toEqual("pi");
  expect(d.topic).toEqual("dlux/pi");
  expect(d.temperaturesTopic).toEqual("dlux/pi/temps");
  expect(d.textTopic).toEqual("dlux/pi/t");
});

const subs = d.subscriptions;

test("dlux tempiratur device subscriptions", () => {
  expect(subs).toHaveLength(5);
  expect(subs[4].topic).toEqual("dlux/pi/temps");
});

test("dlux tempiratur device default temperatures", () => {
  expect(d.temperatures).toEqual([]);
  expect(d.average).toEqual(null);
});

test("dlux tempiratur device temperature callback", () => {
  subs[4].callback(Buffer.from("A1:30.0,B2:60.24"));
  expect(d.temperatures).toEqual([30.0, 60.24]);
  expect(d.average).toEqual(45.12);
});

test("dlux tempiratur device temperature callback with order", () => {
  d.order = ["B2", "A1"];
  subs[4].callback(Buffer.from("A1:30.0,B2:60.48"));
  expect(d.temperatures).toEqual([60.48, 30.0]);
  expect(d.average).toEqual(45.24);
});

test("dlux tempiratur device temperature callback with null temps", () => {
  d.order = ["B2", "C3", "A1"];
  subs[4].callback(Buffer.from("A1:30.0,B2:no"));
  expect(d.temperatures).toEqual([null, null, 30.0]);
  expect(d.average).toEqual(30.0);
});
