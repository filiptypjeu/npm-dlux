import { DluxColorType, DluxLedDevice, DluxSceneType } from "../index";
import { TOPICS_DLUX } from "./VARS";

const d = new DluxLedDevice({ name: "led", topic: "dlux/l2" });

test("dlux mqtt led device basic properties", () => {
  expect(d.name).toEqual("led");
  expect(d.topic).toEqual("dlux/l2");
  expect(d.on).toEqual(false);
});

const subs = d.subscriptions;

test("dlux mqtt led device subscriptions", () => {
  expect(subs).toHaveLength(TOPICS_DLUX + 1);
  expect(subs[TOPICS_DLUX].topic).toEqual("dlux/l2/states");
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
  subs[TOPICS_DLUX].callback(Buffer.from("2:4:999:0:1:1:1:255,254,253,252"), "");
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
  expect(d.on).toEqual(false);
});
