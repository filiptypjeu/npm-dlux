export type Hue = number;
export type HV = [number, number];
export type RGB = [number, number, number];
export type RGBW = [number, number, number, number];
export type Color = Hue | HV | RGB | RGBW;
export enum ColorType {
  ERROR = -1,
  Hue = 1,
  HV = 2,
  RGB = 3,
  RGBW = 4,
}
export enum SceneType {
  ERROR = -1,
  OFF = 0,
  STATIC = 1,
  PATTERN = 2,
  SWAP = 3,
  FLOW = 4,
  STROBE = 5,
  CHASE = 6,
}
export type MS = number;
export type MS10 = number;
export type MS100 = number;
export type Leds = number;
export type ColorNumber<T extends Color> = [T, number];
export type Pattern<T extends Color> = [T, Leds][];
export type Swaps<T extends Color> = [T, MS100][];

interface IScene<T extends Color> extends Object {
  type: SceneType;
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
  type: SceneType.STATIC;
  color: T;
}

export interface IScenePattern<T extends Color> extends IScene<T> {
  type: SceneType.PATTERN;
  colors: Pattern<T>;
}

export interface ISceneSwap<T extends Color> extends IScene<T> {
  type: SceneType.SWAP;
  colors: Swaps<T>;
}

export interface ISceneFlow<T extends Color> extends IScene<T> {
  type: SceneType.FLOW;
  colors: Swaps<T>;
}

export interface ISceneStrobe<T extends Color> extends IScene<T> {
  type: SceneType.STROBE;
  color: T;
  color2: T;
  time: MS;
  time2: MS;
  pulses: number;
}

export interface ISceneChase<T extends Color> extends IScene<T> {
  type: SceneType.CHASE;
  color: T;
  color2: T;
  time: MS10;
  sections: number;
  ledsPerSection: Leds;
  reverse?: boolean;
  comet?: boolean;
}

export interface DluxLedStatus {
  scene: SceneType;
  colorType: ColorType;
  bufferSize: number;
  powerOn: boolean;
  dataOn: boolean;
  sceneOn: boolean;
  sceneUpdating: boolean;
}

const BIT = (b?: boolean) => (b ? 1 : 0);

class InternalLedData {
  private readonly bytes: number[] = [];
  private colorSize: number = 0;

  constructor(private readonly scene: SceneType) {}

  public addByte = (value: number) => this.bytes.push(Math.min(Math.max(value, 0), 255));

  public addColor = (color: Color) => {
    const array = Array.isArray(color) ? color : [color];

    // This only works because the different color types have different amount of components (dlux also uses this fact internally)
    if (!this.colorSize) {
      this.colorSize = array.length;
    } else if (this.colorSize !== array.length) {
      throw new Error("Color type mismatch");
    }

    array.forEach(c => this.addByte(c));
  };

  public build = (): Buffer => Buffer.from([this.scene, this.colorSize].concat(this.bytes));
}

export const encode = <T extends Color>(scene?: IScene<T>): Buffer => {
  // OFF
  if (!scene) {
    return Buffer.from("");
  }

  const d = new InternalLedData(scene.type);

  switch (scene.type) {
    case SceneType.STATIC: {
      const o = scene as ISceneStatic<T>;
      d.addColor(o.color);
      break;
    }

    case SceneType.PATTERN:
    case SceneType.SWAP:
    case SceneType.FLOW: {
      const o = scene as ISceneFlow<T>;

      o.colors.forEach(p => {
        if (p[1] <= 0) return;

        d.addColor(p[0]);
        d.addByte(p[1]);
      });
      break;
    }

    case SceneType.STROBE: {
      const o = scene as ISceneStrobe<T>;

      d.addColor(o.color);
      d.addByte(o.time);
      d.addColor(o.color2);
      d.addByte(o.time2);
      d.addByte(o.pulses);
      break;
    }

    case SceneType.CHASE: {
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

export const status = (msg: string): DluxLedStatus => {
  const a = msg.trim().split(":");
  return {
    scene: Number(a[0]) in SceneType ? (Number(a[0]) as SceneType) : SceneType.ERROR,
    colorType: Number(a[1]) in ColorType ? (Number(a[1]) as ColorType) : ColorType.ERROR,
    bufferSize: Number(a[2]) || 0,
    powerOn: a[3] === "1",
    dataOn: a[4] === "1",
    sceneOn: a[5] === "1",
    sceneUpdating: a[6] === "1",
  };
};
