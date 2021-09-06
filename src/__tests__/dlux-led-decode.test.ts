import { ColorType, status, SceneType } from "../index";

test("status #1", () => {
  expect(status("3:3:10:1:1:1:1")).toEqual({
    scene: SceneType.SWAP,
    colorType: ColorType.RGB,
    bufferSize: 10,
    powerOn: true,
    dataOn: true,
    sceneOn: true,
    sceneUpdating: true,
  });
});

test("status #2", () => {
  expect(status("5:1:424242:0:1:1:0")).toEqual({
    scene: SceneType.STROBE,
    colorType: ColorType.Hue,
    bufferSize: 424242,
    powerOn: false,
    dataOn: true,
    sceneOn: true,
    sceneUpdating: false,
  });
});

test("status #3", () => {
  expect(status("7:5:-1:no:true:10:-1")).toEqual({
    scene: SceneType.ERROR,
    colorType: ColorType.ERROR,
    bufferSize: -1,
    powerOn: false,
    dataOn: false,
    sceneOn: false,
    sceneUpdating: false,
  });
});
