import { toMorse } from "./morse-dictionary";

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
  // colorType?: ColorType;
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
  color?: RGBW;
}

const BIT = (b?: boolean) => (b ? 1 : 0);
const BYTE = (b: number) => Math.min(Math.max(b, 0), 255);

class InternalLedData {
  private readonly bytes: number[] = [];
  private colorSize: number = 0;

  constructor(private readonly scene: SceneType) {}

  public addByte = (value: number) => this.bytes.push(BYTE(value));

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

/**
 * Encode a dlux LED scene into a Buffer to be able to send it to the device.
 */
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

/**
 * Decode a dlux LED scene buffer into a human readable format.
 */
// export const decode = (buffer: Buffer): IScene<any> => {

//   // Check scene type
//   if (buffer.length === 0) {
//     return { type: SceneType.OFF };
//   }
//   if (!(buffer[0] in SceneType)) {
//     return { type: SceneType.ERROR };
//   }
//   const type = buffer[0] as SceneType;

//   // Check color type/size
//   let colorType = ColorType.RGB;
//   if (buffer.length > 1) {
//     if (!(buffer[1] in ColorType)) {
//       return { type, colorType: ColorType.ERROR };
//     }
//     colorType = buffer[1];
//   }

//   const size = Math.max(0, buffer.length - 2);

//   switch (type) {
//     case SceneType.STATIC: {
//       break;
//     }

//     case SceneType.PATTERN:
//     case SceneType.SWAP:
//     case SceneType.FLOW: {
//       break;
//     }

//     case SceneType.STROBE: {
//       break;
//     }

//     case SceneType.CHASE: {
//       break;
//     }

//     default:
//   }

// }

/**
 * Decode a dlux LED status string into a a human readable format.
 */
export const status = (msg: string): DluxLedStatus => {
  const a = msg.trim().split(":");
  const res: DluxLedStatus = {
    scene: Number(a[0]) in SceneType ? (Number(a[0]) as SceneType) : SceneType.ERROR,
    colorType: Number(a[1]) in ColorType ? (Number(a[1]) as ColorType) : ColorType.ERROR,
    bufferSize: Number(a[2]) || 0,
    powerOn: a[3] === "1",
    dataOn: a[4] === "1",
    sceneOn: a[5] === "1",
    sceneUpdating: a[6] === "1",
  };

  // There is basically only a color if the scene is STATIC or OFF, otherwise it might be for example "x,x,x"
  const color = (a[7] || "").split(",").map(s => (s ? BYTE(Number(s)) : NaN));
  if (color.length && !color.includes(NaN)) {
    res.color = color.concat([0, 0, 0, 0]).slice(0, 4) as RGBW;
  }

  return res;
};

export interface IMorse<C extends Color> {
  text: string;
  onColor: C;
  offColor: C;
  dit?: number;
}

export const morse = <C extends Color>(text: string, onColor: C, offColor: C, dit100ms: MS100 = 2): Buffer => {
  // Dit length must be between 1 and 36 (37*7 > 255)
  const dit = Math.min(Math.max(1, dit100ms), 36);
  const dah = dit*3;
  const space = dit; // Space between dits and dahs
  const letterSpace = dit*3; // Space between letters
  const wordSpace = dit*7; // Space between words

  const colors: Swaps<C> = [];

  const words = text.toLowerCase().split(" ").filter(s => s);

  // Loop through all words
  words.forEach(word => {
    const letters = [...word];

    // Loop through all letters in the word
    letters.forEach((letter, i) => {
      const symbols = [...toMorse[letter]];

      // Loop through all morse symbols of the letter
      symbols.forEach((symbol, j) => {
        colors.push([onColor, symbol === "." ? dit : dah]);

        // If between symbols inside a letter
        if (j + 1 < symbols.length) {
          colors.push([offColor, space]);

        // If between letters inside a word
        } else if (i + 1 < letters.length) {
          colors.push([offColor, letterSpace]);

        // If between words
        } else {
          colors.push([offColor, wordSpace]);
        }
      });
    });
  });

  const scene: ISceneSwap<C> = {
    type: SceneType.SWAP,
    colors,
  };
  return encode(scene);
}
