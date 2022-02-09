import { DluxLedDevice } from "../mqtt/DluxLedDevice";
import { DluxColorType, DluxSceneType } from "../led/enums";

const d = new DluxLedDevice("led", "dlux/l2");

test("dlux mqtt led device basic properties", () => {
  expect(d.name).toEqual("led");
  expect(d.topic).toEqual("dlux/l2");
  expect(d.statesTopic).toEqual("dlux/l2/states");
  expect(d.actionTopic).toEqual("dlux/l2/a");
  expect(d.sceneTopic).toEqual("dlux/l2/s");
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
