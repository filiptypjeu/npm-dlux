import { DluxMqttDevice } from "../index";
import { TOPICS_DLUX } from "./VARS";

const d = new DluxMqttDevice({
  name: "device",
  topic: "dlux/l1",
});

test("dlux mqtt device basic properties", () => {
  expect(d.name).toEqual("device");
  expect(d.topic).toEqual("dlux/l1");
});

const subs = d.subscriptions;

test("dlux mqtt device subscriptions", () => {
  expect(subs.map(s => s.topic)).toEqual(TOPICS_DLUX.map(t => `dlux/l1/${t}`));
});

test("dlux mqtt device subscription topics", () => {
  expect(subs[0].topic).toEqual("dlux/l1/status");
  expect(subs[1].topic).toEqual("dlux/l1/version");
  expect(subs[2].topic).toEqual("dlux/l1/inputs");
  expect(subs[3].topic).toEqual("dlux/l1/outputs");
});

test("dlux mqtt device status callback", () => {
  expect(d.online).toEqual(false);
  expect(d.status).toEqual("offline");
  subs[0].callback(Buffer.from("online"), "");
  expect(d.online).toEqual(true);
  expect(d.status).toEqual("online");
  subs[0].callback(Buffer.from("disconnected"), "");
  expect(d.online).toEqual(false);
  expect(d.status).toEqual("disconnected");
});

test("dlux mqtt device version callback", () => {
  expect(d.version).toEqual("");
  subs[1].callback(Buffer.from("v.1.0"), "");
  expect(d.version).toEqual("v.1.0");
});

test("dlux mqtt device default inputs", () => {
  const inputs = d.inputs;
  expect(inputs).toHaveLength(8);
  expect(inputs).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
});

test("dlux mqtt device default outputs", () => {
  const outputs = d.outputs;
  expect(outputs).toHaveLength(8);
  expect(outputs).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
});

test("dlux mqtt device set inputs with callback", () => {
  // Give 9 values
  subs[2].callback(Buffer.from(":-:asd:042:42:1:999:0:1"), "");
  const inputs = d.inputs;

  expect(inputs).toHaveLength(8);
  expect(inputs).toEqual([undefined, undefined, NaN, 42, undefined, true, 999, false]);
});

test("dlux mqtt device set outputs with callback", () => {
  // Give 9 values
  subs[3].callback(Buffer.from("-a011-?01"), "");
  const outputs = d.outputs;

  expect(outputs).toHaveLength(8);
  expect(outputs).toEqual([undefined, undefined, false, true, true, undefined, undefined, false]);
});

test("dlux mqtt device default temperatures", () => {
  expect(d.temperatures).toEqual([]);
});

test("dlux mqtt device temperature callback", () => {
  subs.find(s => s.topic.includes("temps"))!.callback(Buffer.from("A1:30.0,B2:60.24"), "");
  expect(d.temperatures).toEqual([30.0, 60.24]);
});

test("dlux mqtt device temperature callback with order", () => {
  const d2 = new DluxMqttDevice({
    name: "pi",
    topic: "dlux/pi",
    thermometerOrder: ["B2", "A1"],
  });
  d2.subscriptions.find(s => s.topic.includes("temps"))!.callback(Buffer.from("A1:30.0,B2:60.48"), "");
  expect(d2.temperatures).toEqual([60.48, 30.0]);
});

test("dlux mqtt device temperature callback with null temps", () => {
  const d3 = new DluxMqttDevice({
    name: "pi",
    topic: "dlux/pi",
    thermometerOrder: ["B2", "C3", "A1"],
  });
  d3.subscriptions.find(s => s.topic.includes("temps"))!.callback(Buffer.from("A1:30.0,B2:no"), "");
  expect(d3.temperatures).toEqual([null, null, 30.0]);
});

test("dlux mqtt device throw when no client", () => {
  expect(() => d.client).toThrow();
});
