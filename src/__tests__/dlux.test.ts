import { encode, IScenePattern, ISceneStatic } from "../index";

test("off", () => {
  expect(encode()).toEqual({ scene: 1, data: Buffer.from([]) });
});

test("STATIC HV color", () => {
  const o: ISceneStatic = {
    type: "STATIC",
    color: [0x55, 0x01],
  };

  expect(encode(o)).toEqual({ scene: 1, data: Buffer.from([0x55, 0x01]) });

  o.color = [1000, -5];
  expect(encode(o)).toEqual({ scene: 1, data: Buffer.from([0xff, 0x00]) });
});

test("STATIC hue color", () => {
  const o: ISceneStatic = {
    type: "STATIC",
    color: 0x42,
  };

  expect(encode(o)).toEqual({ scene: 41, data: Buffer.from([0x42]) });

  o.color = -1;
  expect(encode(o)).toEqual({ scene: 41, data: Buffer.from([0x00]) });
});

test("STATIC RGB color", () => {
  const o: ISceneStatic = {
    type: "STATIC",
    color: [0x33, 0x44, 0x55],
  };

  expect(encode(o)).toEqual({ scene: 21, data: Buffer.from([0x33, 0x44, 0x55]) });

  o.color = [-25, 256, 255];
  expect(encode(o)).toEqual({ scene: 21, data: Buffer.from([0x00, 0xff, 0xff]) });
});

test("PATTERN HV color", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    pattern: [[[0x01, 0x02], 5], [[0x02, 0x03], 2], [[0x10, 0x09], 3]],
  };

  expect(encode(o)).toEqual({ scene: 2, data: Buffer.from([0x01, 0x02, 5, 0x02, 0x03, 2, 0x10, 0x09, 3]) });

  o.pattern = [[[-1, 0], -1], [[0x02, 0x03], 0], [[255, 256], 257]];
  expect(encode(o)).toEqual({ scene: 2, data: Buffer.from([0x0ff, 0x0ff, 0xff]) });
});

test("PATTERN RGB color", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    pattern: [[[0x01, 0x02, 0x03], 5], [[0x02, 0x03, 0x04], 2], [[0x10, 0x09, 0x08], 3]],
  };

  expect(encode(o)).toEqual({ scene: 22, data: Buffer.from([0x01, 0x02, 0x03, 5, 0x02, 0x03, 0x04, 2, 0x10, 0x09, 0x08, 3]) });

  o.pattern = [[[-1, 0, -3], -1], [[0x02, 0x03, 0x04], 0], [[255, 256, 257], 257]];
  expect(encode(o)).toEqual({ scene: 22, data: Buffer.from([0x0ff, 0x0ff, 0xff, 0xff]) });
});

test("PATTERN hue color", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    pattern: [[0x01, 5], [0x02, 2], [0x03, 3]],
  };

  expect(encode(o)).toEqual({ scene: 42, data: Buffer.from([0x01, 5, 0x02, 2, 0x03, 3]) });

  o.pattern = [[-1, -1], [0x10, 0], [260, 260]];
  expect(encode(o)).toEqual({ scene: 42, data: Buffer.from([0x0ff, 0xff]) });
});

test("PATTERN throw", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    pattern: [[0x01, 5], [[0x01, 0x02], 2]],
  };

  // Color type mismatch
  expect(() => encode(o)).toThrow();


  // Color type mismatch
  o.pattern = [[0x01, 5], [[0x01, 0x02, 0x03], 2]];
  expect(() => encode(o)).toThrow();

  // Color type mismatch
  o.pattern = [[[0x01, 0x02, 0x03], 2], [0x01, 5]];
  expect(() => encode(o)).toThrow();

  // Color type mismatch
  o.pattern = [[[0x01, 0x02], 2], [0x01, 5]];
  expect(() => encode(o)).toThrow();
});
