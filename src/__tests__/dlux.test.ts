import { encode, IScenePattern, ISceneStatic, ISceneSwap } from "../index";

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

test("PATTERN/SWAP HV color", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    colors: [
      [[0x01, 0x02], 5],
      [[0x02, 0x03], 2],
      [[0x10, 0x09], 3],
    ],
  };
  const o2: ISceneSwap = { ...o, type: "SWAP" };

  expect(encode(o)).toEqual({ scene: 2, data: Buffer.from([0x01, 0x02, 5, 0x02, 0x03, 2, 0x10, 0x09, 3]) });
  expect(encode(o2)).toEqual({ scene: 3, data: Buffer.from([0x01, 0x02, 5, 0x02, 0x03, 2, 0x10, 0x09, 3]) });

  o2.colors = [
    [[-1, 0], -1],
    [[0x02, 0x03], 0],
    [[255, 256], 257],
  ];
  o.colors = o2.colors;

  expect(encode(o)).toEqual({ scene: 2, data: Buffer.from([0x0ff, 0x0ff, 0xff]) });
  expect(encode(o2)).toEqual({ scene: 3, data: Buffer.from([0x0ff, 0x0ff, 0xff]) });
});

test("PATTERN/SWAP RGB color", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    colors: [
      [[0x01, 0x02, 0x03], 5],
      [[0x02, 0x03, 0x04], 2],
      [[0x10, 0x09, 0x08], 3],
    ],
  };
  const o2: ISceneSwap = { ...o, type: "SWAP" };

  expect(encode(o)).toEqual({ scene: 22, data: Buffer.from([0x01, 0x02, 0x03, 5, 0x02, 0x03, 0x04, 2, 0x10, 0x09, 0x08, 3]) });
  expect(encode(o2)).toEqual({ scene: 23, data: Buffer.from([0x01, 0x02, 0x03, 5, 0x02, 0x03, 0x04, 2, 0x10, 0x09, 0x08, 3]) });

  o.colors = [
    [[-1, 0, -3], -1],
    [[0x02, 0x03, 0x04], 0],
    [[255, 256, 257], 257],
  ];
  o2.colors = o.colors;

  expect(encode(o)).toEqual({ scene: 22, data: Buffer.from([0x0ff, 0x0ff, 0xff, 0xff]) });
  expect(encode(o2)).toEqual({ scene: 23, data: Buffer.from([0x0ff, 0x0ff, 0xff, 0xff]) });
});

test("PATTERN/SWAP hue color", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    colors: [
      [0x01, 5],
      [0x02, 2],
      [0x03, 3],
    ],
  };
  const o2: ISceneSwap = { ...o, type: "SWAP" };

  expect(encode(o)).toEqual({ scene: 42, data: Buffer.from([0x01, 5, 0x02, 2, 0x03, 3]) });
  expect(encode(o2)).toEqual({ scene: 43, data: Buffer.from([0x01, 5, 0x02, 2, 0x03, 3]) });

  o.colors = [
    [-1, -1],
    [0x10, 0],
    [260, 260],
  ];
  o2.colors = o.colors;

  expect(encode(o)).toEqual({ scene: 42, data: Buffer.from([0x0ff, 0xff]) });
  expect(encode(o2)).toEqual({ scene: 43, data: Buffer.from([0x0ff, 0xff]) });
});

test("PATTERN/SWAP throw", () => {
  const o: IScenePattern = {
    type: "PATTERN",
    colors: [
      [0x01, 5],
      [[0x01, 0x02], 2],
    ],
  };
  const o2: ISceneSwap = { ...o, type: "SWAP" };

  // Color type mismatch
  expect(() => encode(o)).toThrow();
  expect(() => encode(o2)).toThrow();

  // Color type mismatch
  o.colors = [
    [0x01, 5],
    [[0x01, 0x02, 0x03], 2],
  ];
  o2.colors = o.colors;
  expect(() => encode(o)).toThrow();
  expect(() => encode(o2)).toThrow();

  // Color type mismatch
  o.colors = [
    [[0x01, 0x02, 0x03], 2],
    [0x01, 5],
  ];
  o2.colors = o.colors;
  expect(() => encode(o)).toThrow();
  expect(() => encode(o2)).toThrow();

  // Color type mismatch
  o.colors = [
    [[0x01, 0x02], 2],
    [0x01, 5],
  ];
  o2.colors = o.colors;
  expect(() => encode(o)).toThrow();
  expect(() => encode(o2)).toThrow();
});
