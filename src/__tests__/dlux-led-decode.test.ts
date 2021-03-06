import { DluxColorType, DluxSceneType, status } from "../index";

test("status #1", () => {
  expect(status("3:3:10:1:1:1:1:123,-1,1000")).toEqual({
    scene: DluxSceneType.SWAP,
    colorType: DluxColorType.RGB,
    bufferSize: 10,
    powerOn: true,
    dataOn: true,
    sceneOn: true,
    sceneUpdating: true,
    color: [123, 0, 255, 0],
  });
});

test("status #2", () => {
  expect(status("5:1:424242:true:1:1:0")).toEqual({
    scene: DluxSceneType.STROBE,
    colorType: DluxColorType.Hue,
    bufferSize: 424242,
    powerOn: false,
    dataOn: true,
    sceneOn: true,
    sceneUpdating: false,
  });
});

test("status #3", () => {
  expect(status("8:5:-1:-:-:10:-1:100,150,200,")).toEqual({
    scene: DluxSceneType.ERROR,
    colorType: DluxColorType.ERROR,
    bufferSize: -1,
    sceneOn: false,
    sceneUpdating: false,
  });
});
