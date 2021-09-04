import { decode } from "../index";

test("decode #1", () => {
  expect(decode("1:1:1:1:3:10:3")).toEqual({
    powerOn: true,
    dataOn: true,
    sceneOn: true,
    sceneUpdating: true,
    scene: "SWAP",
    bufferSize: 10,
    colorType: "RGB",
  });
});

test("decode #2", () => {
  expect(decode("0:1:1:0:5:424242:1")).toEqual({
    powerOn: false,
    dataOn: true,
    sceneOn: true,
    sceneUpdating: false,
    scene: "STROBE",
    bufferSize: 424242,
    colorType: "Hue",
  });
});

test("decode #3", () => {
  expect(decode("no:true:10:-1:7:-1:5")).toEqual({
    powerOn: false,
    dataOn: false,
    sceneOn: false,
    sceneUpdating: false,
    scene: "ERROR",
    bufferSize: -1,
    colorType: "ERROR",
  });
});
