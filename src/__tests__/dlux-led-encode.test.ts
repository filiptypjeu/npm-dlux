import { encode, Hue, HV, ISceneChase, ISceneFlow, IScenePattern, ISceneStatic, ISceneStrobe, ISceneSwap, RGB } from "../index";

test("encode non-supported scene type throw", () => {
  const o: ISceneStatic<HV> = {
    type: "nothing" as "STATIC",
    color: [0x55, 0x01],
  };

  expect(() => encode(o)).toThrow();
});

test("encode color type mismatch throw", () => {
  const o: IScenePattern<HV> = {
    type: "PATTERN",
    colors: [[[0x55, 0x01], 1], [0x55, 1] as unknown as [HV, number]],
  };

  expect(() => encode(o)).toThrow();
});

test("off", () => {
  expect(encode()).toEqual({ scene: 0, data: Buffer.from([]) });
});

test("STATIC HV color", () => {
  const o: ISceneStatic<HV> = {
    type: "STATIC",
    color: [0x55, 0x01],
  };

  expect(encode(o)).toEqual({ scene: 1, data: Buffer.from([0x55, 0x01]) });

  o.color = [1000, -5];
  expect(encode(o)).toEqual({ scene: 1, data: Buffer.from([0xff, 0x00]) });
});

test("STATIC hue color", () => {
  const o: ISceneStatic<Hue> = {
    type: "STATIC",
    color: 0x42,
  };

  expect(encode(o)).toEqual({ scene: 41, data: Buffer.from([0x42]) });

  o.color = -1;
  expect(encode(o)).toEqual({ scene: 41, data: Buffer.from([0x00]) });
});

test("STATIC RGB color", () => {
  const o: ISceneStatic<RGB> = {
    type: "STATIC",
    color: [0x33, 0x44, 0x55],
  };

  expect(encode(o)).toEqual({ scene: 21, data: Buffer.from([0x33, 0x44, 0x55]) });

  o.color = [-25, 256, 255];
  expect(encode(o)).toEqual({ scene: 21, data: Buffer.from([0x00, 0xff, 0xff]) });
});

test("PATTERN/SWAP/FLOW HV color", () => {
  const o: IScenePattern<HV> = {
    type: "PATTERN",
    colors: [
      [[0x01, 0x02], 5],
      [[0x02, 0x03], 2],
      [[0x10, 0x09], 3],
    ],
  };
  const o2: ISceneSwap<HV> = { ...o, type: "SWAP" };
  const o3: ISceneFlow<HV> = { ...o, type: "FLOW" };

  expect(encode(o)).toEqual({ scene: 2, data: Buffer.from([0x01, 0x02, 5, 0x02, 0x03, 2, 0x10, 0x09, 3]) });
  expect(encode(o2)).toEqual({ scene: 3, data: Buffer.from([0x01, 0x02, 5, 0x02, 0x03, 2, 0x10, 0x09, 3]) });
  expect(encode(o3)).toEqual({ scene: 4, data: Buffer.from([0x01, 0x02, 5, 0x02, 0x03, 2, 0x10, 0x09, 3]) });

  o.colors = [
    [[-1, 0], -1],
    [[0x02, 0x03], 0],
    [[255, 256], 257],
  ];
  o2.colors = o.colors;
  o3.colors = o.colors;

  expect(encode(o)).toEqual({ scene: 2, data: Buffer.from([0x0ff, 0x0ff, 0xff]) });
  expect(encode(o2)).toEqual({ scene: 3, data: Buffer.from([0x0ff, 0x0ff, 0xff]) });
  expect(encode(o3)).toEqual({ scene: 4, data: Buffer.from([0x0ff, 0x0ff, 0xff]) });
});

test("PATTERN/SWAP/FLOW RGB color", () => {
  const o: IScenePattern<RGB> = {
    type: "PATTERN",
    colors: [
      [[0x01, 0x02, 0x03], 5],
      [[0x02, 0x03, 0x04], 2],
      [[0x10, 0x09, 0x08], 3],
    ],
  };
  const o2: ISceneSwap<RGB> = { ...o, type: "SWAP" };
  const o3: ISceneFlow<RGB> = { ...o, type: "FLOW" };

  expect(encode(o)).toEqual({ scene: 22, data: Buffer.from([0x01, 0x02, 0x03, 5, 0x02, 0x03, 0x04, 2, 0x10, 0x09, 0x08, 3]) });
  expect(encode(o2)).toEqual({ scene: 23, data: Buffer.from([0x01, 0x02, 0x03, 5, 0x02, 0x03, 0x04, 2, 0x10, 0x09, 0x08, 3]) });
  expect(encode(o3)).toEqual({ scene: 24, data: Buffer.from([0x01, 0x02, 0x03, 5, 0x02, 0x03, 0x04, 2, 0x10, 0x09, 0x08, 3]) });

  o.colors = [
    [[-1, 0, -3], -1],
    [[0x02, 0x03, 0x04], 0],
    [[255, 256, 257], 257],
  ];
  o2.colors = o.colors;
  o3.colors = o.colors;

  expect(encode(o)).toEqual({ scene: 22, data: Buffer.from([0x0ff, 0x0ff, 0xff, 0xff]) });
  expect(encode(o2)).toEqual({ scene: 23, data: Buffer.from([0x0ff, 0x0ff, 0xff, 0xff]) });
  expect(encode(o3)).toEqual({ scene: 24, data: Buffer.from([0x0ff, 0x0ff, 0xff, 0xff]) });
});

test("PATTERN/SWAP/FLOW hue color", () => {
  const o: IScenePattern<Hue> = {
    type: "PATTERN",
    colors: [
      [0x01, 5],
      [0x02, 2],
      [0x03, 3],
    ],
  };
  const o2: ISceneSwap<Hue> = { ...o, type: "SWAP" };
  const o3: ISceneFlow<Hue> = { ...o, type: "FLOW" };

  expect(encode(o)).toEqual({ scene: 42, data: Buffer.from([0x01, 5, 0x02, 2, 0x03, 3]) });
  expect(encode(o2)).toEqual({ scene: 43, data: Buffer.from([0x01, 5, 0x02, 2, 0x03, 3]) });
  expect(encode(o3)).toEqual({ scene: 44, data: Buffer.from([0x01, 5, 0x02, 2, 0x03, 3]) });

  o.colors = [
    [-1, -1],
    [0x10, 0],
    [260, 260],
  ];
  o2.colors = o.colors;
  o3.colors = o.colors;

  expect(encode(o)).toEqual({ scene: 42, data: Buffer.from([0x0ff, 0xff]) });
  expect(encode(o2)).toEqual({ scene: 43, data: Buffer.from([0x0ff, 0xff]) });
  expect(encode(o3)).toEqual({ scene: 44, data: Buffer.from([0x0ff, 0xff]) });
});

test("STROBE HV color", () => {
  const o: ISceneStrobe<HV> = {
    type: "STROBE",
    color: [0x01, 0x02],
    color2: [0x02, 0x03],
    time: 2,
    time2: 3,
    pulses: 4,
  };

  expect(encode(o)).toEqual({ scene: 5, data: Buffer.from([0x01, 0x02, 2, 0x02, 0x03, 3, 4]) });

  o.time = -1;
  o.time2 = 1000;
  expect(encode(o)).toEqual({ scene: 5, data: Buffer.from([0x01, 0x02, 0, 0x02, 0x03, 0xff, 4]) });
});

test("STROBE RGB color", () => {
  const o: ISceneStrobe<RGB> = {
    type: "STROBE",
    color: [0x01, 0x02, 0x03],
    color2: [0x02, 0x03, 0x04],
    time: 2,
    time2: 3,
    pulses: 4,
  };

  expect(encode(o)).toEqual({ scene: 25, data: Buffer.from([0x01, 0x02, 0x03, 2, 0x02, 0x03, 0x04, 3, 4]) });
});

test("STROBE hue color", () => {
  const o: ISceneStrobe<Hue> = {
    type: "STROBE",
    color: 0x01,
    color2: 0x02,
    time: 2,
    time2: 3,
    pulses: 4,
  };

  expect(encode(o)).toEqual({ scene: 45, data: Buffer.from([0x01, 2, 0x02, 3, 4]) });
});

test("CHASE HV color", () => {
  const o: ISceneChase<HV> = {
    type: "CHASE",
    color: [0x01, 0x02],
    color2: [0x02, 0x03],
    time: 10,
    sections: 4,
    ledsPerSection: 5,
  };

  expect(encode(o)).toEqual({ scene: 6, data: Buffer.from([0x01, 0x02, 10, 0x02, 0x03, 4, 5, 0]) });

  o.time = -1;
  expect(encode(o)).toEqual({ scene: 6, data: Buffer.from([0x01, 0x02, 0, 0x02, 0x03, 4, 5, 0]) });

  o.ledsPerSection = 1000;
  expect(encode(o)).toEqual({ scene: 6, data: Buffer.from([0x01, 0x02, 0, 0x02, 0x03, 4, 0xff, 0]) });

  o.reverse = true;
  expect(encode(o)).toEqual({ scene: 6, data: Buffer.from([0x01, 0x02, 0, 0x02, 0x03, 4, 0xff, 0b1]) });

  o.comet = true;
  expect(encode(o)).toEqual({ scene: 6, data: Buffer.from([0x01, 0x02, 0, 0x02, 0x03, 4, 0xff, 0b11]) });

  o.reverse = false;
  expect(encode(o)).toEqual({ scene: 6, data: Buffer.from([0x01, 0x02, 0, 0x02, 0x03, 4, 0xff, 0b10]) });

  o.comet = false;
  expect(encode(o)).toEqual({ scene: 6, data: Buffer.from([0x01, 0x02, 0, 0x02, 0x03, 4, 0xff, 0]) });
});

test("CHASE RGB color", () => {
  const o: ISceneChase<RGB> = {
    type: "CHASE",
    color: [0x01, 0x02, 0x03],
    color2: [0x02, 0x03, 0x04],
    time: 10,
    sections: 4,
    ledsPerSection: 5,
    comet: true,
    reverse: false,
  };

  expect(encode(o)).toEqual({ scene: 26, data: Buffer.from([0x01, 0x02, 0x03, 10, 0x02, 0x03, 0x04, 4, 5, 0b10]) });
});

test("CHASE hue color", () => {
  const o: ISceneChase<Hue> = {
    type: "CHASE",
    color: 0x01,
    color2: 0x02,
    time: 10,
    sections: 4,
    ledsPerSection: 5,
    comet: true,
    reverse: false,
  };

  expect(encode(o)).toEqual({ scene: 46, data: Buffer.from([0x01, 10, 0x02, 4, 5, 0b10]) });
});
