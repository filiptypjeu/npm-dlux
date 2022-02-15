import { DluxColorType, DluxLedDevice, DluxSceneType } from "../index";

const d = new DluxLedDevice({ name: "led", topic: "dlux/l2" });

test("dlux mqtt led device basic properties", () => {
  expect(d.name).toEqual("led");
  expect(d.topic).toEqual("dlux/l2");
  expect(d.statesTopic).toEqual("dlux/l2/states");
  expect(d.actionTopic).toEqual("dlux/l2/a");
  expect(d.sceneTopic).toEqual("dlux/l2/s");
  expect(d.statusString).toEqual("led is offline");
});

const subs = d.subscriptions;

test("dlux mqtt led device subscriptions", () => {
  expect(subs).toHaveLength(6);
  expect(subs[5].topic).toEqual("dlux/l2/states");
});

test("dlux mqtt led device default state", () => {
  expect(d.state).toEqual({
    scene: DluxSceneType.ERROR,
    colorType: DluxColorType.ERROR,
    bufferSize: 0,
    sceneOn: false,
    sceneUpdating: false,
  });
});

test("dlux mqtt led device state callback", () => {
  subs[5].callback(Buffer.from("2:4:999:0:1:1:1:255,254,253,252"));
  expect(d.state).toEqual({
    scene: DluxSceneType.PATTERN,
    colorType: DluxColorType.RGBW,
    bufferSize: 999,
    powerOn: false,
    dataOn: true,
    sceneOn: true,
    sceneUpdating: true,
    color: [255, 254, 253, 252],
  });
});

test("dlux mqtt led device status", () => {
  subs[5].callback(Buffer.from("1:4:3:0:0:0:0:255,0,255,0"));
  expect(d.statusString).toEqual("led is offline");
  subs[0].callback(Buffer.from("online"));
  expect(d.statusString).toEqual("led is powerless");
  subs[5].callback(Buffer.from("1:4:3:1:0:0:0:255,0,255,0"));
  expect(d.statusString).toEqual("led can not be controlled");
  subs[5].callback(Buffer.from("1:4:3:1:1:0:0:255,0,255,0"));
  expect(d.statusString).toEqual("led = BLACKOUT");
  subs[5].callback(Buffer.from("1:4:3:1:1:1:0:255,0,255,0"));
  expect(d.statusString).toEqual("led = [255, 0, 255, 0]");
  subs[5].callback(Buffer.from("2:4:10:1:1:1:0:x,x,x,x"));
  expect(d.statusString).toEqual("led = PATTERN");
  subs[5].callback(Buffer.from("3:4:10:1:1:1:0:x,x,x,x"));
  expect(d.statusString).toEqual("led = SWAP");
  subs[5].callback(Buffer.from("4:4:10:1:1:1:0:x,x,x,x"));
  expect(d.statusString).toEqual("led = FLOW");
  subs[5].callback(Buffer.from("5:4:11:1:1:1:0:x,x,x,x"));
  expect(d.statusString).toEqual("led = STROBE");
  subs[5].callback(Buffer.from("6:4:11:1:1:1:0:x,x,x,x"));
  expect(d.statusString).toEqual("led = CHASE");
  subs[5].callback(Buffer.from("7:4:11:1:1:1:0:255,0,255,0"));
  expect(d.statusString).toEqual("led = [255, 0, 255, 0]");
});
