
export type Hue = number;
export type HV = [number, number];
export type RGB = [number, number, number];
export type RGBW = [number, number, number, number];
type Color = Hue | HV | RGB | RGBW;
enum ColorType {
  Hue = 1,
  HV = 2,
  RGB = 3,
  RGBW = 4,
}
enum SceneType {
  OFF = 0,
  STATIC = 1,
  PATTERN = 2,
  SWAP = 3,
  FLOW = 4,
  STROBE = 5,
  CHASE = 6,
}
type MS = number;
type MS10 = number;
type MS100 = number;
type Leds = number;
export type ColorNumber<T extends Color> = [T, number];
export type Pattern<T extends Color> = [T, Leds][];
export type Swaps<T extends Color> = [T, MS100][];

interface IScene<T extends Color> extends Object {
  type: keyof typeof SceneType;
  color?: T;
  color2?: T;
  colors?: ColorNumber<T>[];
  time?: number;
  time2?: number;
  pulses?: number;
  sections?: number;
  ledsPerSection?: number;
  reverse?: boolean;
  comet?: boolean;
}

export interface ISceneStatic<T extends Color> extends IScene<T> {
  type: "STATIC";
  color: T;
}

export interface IScenePattern<T extends Color> extends IScene<T> {
  type: "PATTERN";
  colors: Pattern<T>;
}

export interface ISceneSwap<T extends Color> extends IScene<T> {
  type: "SWAP";
  colors: Swaps<T>;
}

export interface ISceneFlow<T extends Color> extends IScene<T> {
  type: "FLOW";
  colors: Swaps<T>;
}

export interface ISceneStrobe<T extends Color> extends IScene<T> {
  type: "STROBE";
  color: T;
  color2: T;
  time: MS;
  time2: MS;
  pulses: number;
}

export interface ISceneChase<T extends Color> extends IScene<T> {
  type: "CHASE";
  color: T;
  color2: T;
  time: MS10;
  sections: number;
  ledsPerSection: Leds;
  reverse?: boolean;
  comet?: boolean;
}

export interface DluxLed {
  scene: number;
  data: Buffer;
}

export interface DluxLedStatus {
  powerOn: boolean;
  dataOn: boolean;
  sceneOn: boolean;
  sceneUpdating: boolean;
  scene: keyof typeof SceneType | "ERROR";
  bufferSize: number;
  colorType: keyof typeof ColorType | "ERROR";
}

const BIT = (b?: boolean) => (b ? 1 : 0);

class InternalLedData {
  private readonly bytes: number[] = [];
  private readonly scene: number;
  private colorType: number = 0;

  constructor(scene: keyof typeof SceneType) {
    this.scene = SceneType[scene];
  }

  public addByte = (value: number) => this.bytes.push(Math.min(Math.max(value, 0), 255));

  public addColor = (color: Color) => {
    const array = Array.isArray(color) ? color : [color];

    if (!this.colorType) {
      this.colorType = array.length;
    } else if (this.colorType !== array.length) {
      throw new Error("Color type mismatch");
    }

    array.forEach(c => this.addByte(c));
  };

  public build = (): DluxLed => {
    let s = this.scene;
    switch (this.colorType) {
      case 0:
        if (this.bytes.length) {
          throw new Error("No color added");
        }
        break;

      case 1:
        s += 40;
        break;

      case 3:
        s += 20;
        break;

      case 4:
        s += 60;
        break;

      default:
        break;
    }

    return {
      scene: s,
      data: Buffer.from(this.bytes),
    };
  };
}

export const encode = <T extends Color>(scene?: IScene<T>): DluxLed => {
  // OFF
  if (!scene) {
    return {
      scene: 0,
      data: Buffer.from(""),
    };
  }

  const d = new InternalLedData(scene.type);

  switch (scene.type) {
    case "STATIC": {
      const o = scene as ISceneStatic<T>;
      d.addColor(o.color);
      break;
    }

    case "PATTERN":
    case "SWAP":
    case "FLOW": {
      const o = scene as ISceneFlow<T>;

      o.colors.forEach(p => {
        if (p[1] <= 0) return;

        d.addColor(p[0]);
        d.addByte(p[1]);
      });
      break;
    }

    case "STROBE": {
      const o = scene as ISceneStrobe<T>;

      d.addColor(o.color);
      d.addByte(o.time);
      d.addColor(o.color2);
      d.addByte(o.time2);
      d.addByte(o.pulses);
      break;
    }

    case "CHASE": {
      const o = scene as ISceneChase<T>;

      d.addColor(o.color);
      d.addByte(o.time);
      d.addColor(o.color2);
      d.addByte(o.sections);
      d.addByte(o.ledsPerSection);
      /* tslint:disable:no-bitwise */
      d.addByte((BIT(o.comet) << 1) | BIT(o.reverse));
      /* tslint:enable:no-bitwise */
      break;
    }

    default:
      throw new Error(`Unsupported scene "${scene.type}"`);
  }

  return d.build();
};

export const decode = (msg: string): DluxLedStatus => {
  const a = msg.split(":");
  return {
    powerOn: a[0] === "1",
    dataOn: a[1] === "1",
    sceneOn: a[2] === "1",
    sceneUpdating: a[3] === "1",
    scene: Number(a[4]) in SceneType ? (SceneType[Number(a[4])] as keyof typeof SceneType) : "ERROR",
    bufferSize: Number(a[5]) || 0,
    colorType: Number(a[6]) in ColorType ? (ColorType[Number(a[6])] as keyof typeof ColorType) : "ERROR",
  };
};
