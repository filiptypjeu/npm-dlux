import { DluxTempiraturDevice } from "../index";

const d = new DluxTempiraturDevice({
  name: "pi",
  topic: "dlux/pi",
});

test("dlux tempiratur device basic properties", () => {
  expect(d.name).toEqual("pi");
  expect(d.topic).toEqual("dlux/pi");
});

const subs = d.subscriptions;

test("dlux tempiratur device subscriptions", () => {
  expect(subs).toHaveLength(6);
  expect(subs[4].topic).toEqual("dlux/pi/temps");
  expect(subs[5].topic).toEqual("dlux/pi/text/+");
});

test("dlux tempiratur device default temperatures", () => {
  expect(d.temperatures).toEqual([]);
  expect(d.average).toEqual(null);
});

test("dlux tempiratur device temperature callback", () => {
  subs[4].callback(Buffer.from("A1:30.0,B2:60.24"), "");
  expect(d.temperatures).toEqual([30.0, 60.24]);
  expect(d.average).toEqual(45.12);
});

test("dlux tempiratur device temperature callback with order", () => {
  const d2 = new DluxTempiraturDevice({
    name: "pi",
    topic: "dlux/pi",
    order: ["B2", "A1"],
  });
  d2.subscriptions[4].callback(Buffer.from("A1:30.0,B2:60.48"), "");
  expect(d2.temperatures).toEqual([60.48, 30.0]);
  expect(d2.average).toEqual(45.24);
});

test("dlux tempiratur device temperature callback with null temps", () => {
  const d3 = new DluxTempiraturDevice({
    name: "pi",
    topic: "dlux/pi",
    order: ["B2", "C3", "A1"],
  });
  d3.subscriptions[4].callback(Buffer.from("A1:30.0,B2:no"), "");
  expect(d3.temperatures).toEqual([null, null, 30.0]);
  expect(d3.average).toEqual(30.0);
});
