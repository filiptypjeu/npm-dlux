import { toMorse } from "./morse-dictionary";
import { DluxColorType, DluxSceneType, DluxPredefinedColor } from "./enums";
import { DluxLedStatus, IScene, ISceneChase, ISceneFlow, ISceneStatic, ISceneStrobe, ISceneSwap } from "./interfaces";
import { Color, MS100, RGBW, Swaps } from "./types";

export const BLACK = (color: Color): Color => {
  if (!Array.isArray(color)) {
    return 0;
  }
  return color.map(() => 0) as Color;
};

const BIT = (b?: boolean) => (b ? 1 : 0);
const BYTE = (b: number) => Math.min(Math.max(b, 0), 255);

class InternalLedData {
  private readonly bytes: number[] = [];
  private colorSize: number = 0;

  constructor(private readonly scene: DluxSceneType) {}

  public addByte = (value: number) => this.bytes.push(BYTE(value));

  public addColor = (color: Color) => {
    const array = Array.isArray(color) ? color : color in DluxPredefinedColor ? colorToRGBW(color) : [color];

    // This only works because the different color types have different amount of components (dlux also uses this fact internally)
    if (!this.colorSize) {
      this.colorSize = array.length;
    } else if (this.colorSize !== array.length) {
      throw new Error("Color type mismatch");
    }

    array.forEach(c => this.addByte(c));
  };

  public build = (): Buffer => Buffer.from([this.scene].concat(this.colorSize ? [this.colorSize] : []).concat(this.bytes));
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
    case DluxSceneType.STATIC: {
      const o = scene as ISceneStatic<T>;
      d.addColor(o.color);
      break;
    }

    case DluxSceneType.PATTERN:
    case DluxSceneType.SWAP:
    case DluxSceneType.FLOW: {
      const o = scene as ISceneFlow<T>;

      o.colors.forEach(p => {
        if (p[1] <= 0) return;

        d.addColor(p[0]);
        d.addByte(p[1]);
      });
      break;
    }

    case DluxSceneType.STROBE: {
      const o = scene as ISceneStrobe<T>;

      d.addColor(o.color);
      d.addByte(o.time);
      d.addColor(o.color2);
      d.addByte(o.time2);
      d.addByte(o.pulses);
      break;
    }

    case DluxSceneType.CHASE: {
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

    case DluxSceneType.STATIC_RANDOM:
      break;

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
    scene: Number(a[0]) in DluxSceneType ? (Number(a[0]) as DluxSceneType) : DluxSceneType.ERROR,
    colorType: Number(a[1]) in DluxColorType ? (Number(a[1]) as DluxColorType) : DluxColorType.ERROR,
    bufferSize: Number(a[2]) || 0,
    sceneOn: a[5] === "1",
    sceneUpdating: a[6] === "1",
  };

  if (a[3] !== "-") {
    res.powerOn = a[3] === "1";
  }
  if (a[4] !== "-") {
    res.dataOn = a[4] === "1";
  }

  // There is basically only a color if the scene is STATIC or OFF, otherwise it might be for example "x,x,x"
  const color = (a[7] || "").split(",").map(s => (s ? BYTE(Number(s)) : NaN));
  if (color.length && !color.includes(NaN)) {
    res.color = color.concat([0, 0, 0, 0]).slice(0, 4) as RGBW;
  }

  return res;
};

/**
 * Create a Buffer for showing morse code on a dlux LED device. All temporal lengths are in the unit 100ms.
 *
 * @param text The text to encode.
 * @param onColor The color for the dits and dahs.
 * @param offColor The color for all spaces.
 * @param dit100ms The lenght of a dit, by default 200ms.
 * @param dah100ms The length of a dah, by default 3*dit.
 * @param symbolSpace The space between symbols in a letter, by default dit.
 * @param letterSpace The space between letters in a word, by default 3*dit.
 * @param wordSpace The space between words, by default 7*dit.
 */
export const morse = <C extends Color>(
  text: string,
  onColor: C,
  offColor: C,
  dit100ms: MS100 = 2,
  dah100ms?: MS100,
  symboldSpace100ms?: MS100,
  letterSpace100ms?: MS100,
  wordSpace100ms?: MS100
): Buffer => {
  // Dit length must be between 1 and 36 (37*7 > 255)
  const dit = Math.min(Math.max(1, dit100ms), 36);
  const dah = dah100ms || dit * 3;
  const space = symboldSpace100ms || dit; // Space between dits and dahs
  const letterSpace = letterSpace100ms || dit * 3; // Space between letters
  const wordSpace = wordSpace100ms || dit * 7; // Space between words

  const colors: Swaps<C> = [];

  const words = text
    .toLowerCase()
    .split(" ")
    .filter(s => s);

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
    type: DluxSceneType.SWAP,
    colors,
  };
  return encode(scene);
};

export const colorToRGBW = (color: DluxPredefinedColor): RGBW => {
  switch (color) {
    case DluxPredefinedColor.RED:
      return [255, 0, 0, 0];
    case DluxPredefinedColor.GREEN:
      return [0, 255, 0, 0];
    case DluxPredefinedColor.BLUE:
      return [0, 0, 255, 0];
    case DluxPredefinedColor.YELLOW:
      return [255, 255, 0, 0];
    case DluxPredefinedColor.CYAN:
      return [0, 255, 255, 0];
    case DluxPredefinedColor.MAGENTA:
      return [255, 0, 255, 0];
    case DluxPredefinedColor.WHITE:
      return [255, 255, 255, 0];
    case DluxPredefinedColor.WARM_WHITE:
      return [0, 0, 0, 255];
    case DluxPredefinedColor.BLACK:
      return [0, 0, 0, 0];
    case DluxPredefinedColor.RANDOM:
      return [1, 1, 1, 0].map(n => (n ? Math.floor(Math.random() * 256) : 0)) as RGBW;
  }
};

export const statusToString = (status: DluxLedStatus): string => {
  if (status.color) {
    return status.color.toString();
  }
  switch (status.scene) {
    case DluxSceneType.SWAP:
      return "SWAP";
    case DluxSceneType.FLOW:
      return "FLOW";
    case DluxSceneType.STROBE:
      return "STROBE";
    case DluxSceneType.CHASE:
      return "CHASE";
    case DluxSceneType.PATTERN:
      return "PATTERN";
    default:
      return "ERROR";
  }
};
