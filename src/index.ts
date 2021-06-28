
// interface IRGB {
//   r: number;
//   g: number;
//   b: number;
// };
// interface IHV {
//   h: number;
//   v: number;
// };
type RGB = [number, number, number];
type HV = [number, number];
// interface IH {
//   h: number;
// };

// enum SceneEnum {
//   OFF,
//   STATIC,
//   PATTERN,
//   SWAP,
//   FLOW,
//   STROBE,
//   CHASE,
// };

type SceneType = "OFF" | "STATIC" | "PATTERN" | "SWAP" | "FLOW" | "STROBE" | "CHASE";

// enum class SceneEnum : byte {
//   OFF = 0,

//   /**
//    * Static color
//    * Size: 1xCOLOR
//    * Syntax: <COLOR>
//    *  OR
//    * Syntax: <R><G><B>
//    *  OR
//    * Syntax: <H>
//    *  - H = Hue
//    *  - V = Value/brightness
//    * Caveats:
//    *  - IF V==0: randomize H
//    */
//   STATIC = 1,
//   STATIC_RGB = 21,
//   STATIC_HUE = 41,

//   /**
//    * Set a static pattern
//    * Size: N * (1xCOLOR + 1)
//    * Syntax: <COLOR><n><COLOR><n>...
//    *  - H = Hue
//    *  - V = Value/brightness
//    *  - n = Amount of LEDs making up that section
//    */
//   PATTERN = 2,
//   PATTERN_RGB = 22,
//   PATTERN_HUE = 42,

//   /**
//    * Swap between different colors
//    * Size: N * (1xCOLOR + 1)
//    * Syntax: <COLOR><100ms><COLOR><100ms>...
//    *  - H = Hue
//    *  - V = Value/brightness
//    *  - 100ms = Time for the provided color
//    * Caveats:
//    *  - IF size==0: OFF
//    *  - IF size==3: randomize all H's and use V = 0xff
//    */
//   SWAP = 3,
//   SWAP_RGB = 23,
//   SWAP_HUE = 43,

//   /**
//    * Flow between different colors
//    * Size: N * (1xCOLOR + 1)
//    * Syntax: <COLOR><100ms><COLOR><100ms>...
//    *  - H = Hue
//    *  - V = Value/brightness
//    *  - 100ms = Time between provided colors
//    * Caveats:
//    *  - IF size==0: OFF
//    *  - IF size==3: randomize all H's and use V = 0xff
//    */
//   FLOW = 4,
//   FLOW_RGB = 24,
//   FLOW_HUE = 44,

//   /**
//    * Strobe
//    * Size: 2xCOLOR + 3
//    * Syntax: <COLOR><ms ON><COLOR><ms OFF><N>
//    *  - H = Hue
//    *  - V = Value/brightness
//    *  - First pair = ON color
//    *  - Second pair = OFF color
//    *  - ms ON/OFF = Time ON/OFF
//    *  - N = Flashes
//    * Caveats:
//    *  - Basically a special case of SWAP with shorter intervals and a fixed amount of swaps
//    */
//   STROBE = 5,
//   STROBE_RGB = 25,
//   STROBE_HUE = 45,

//   // XXX: Add parameter "steps", saying how many steps the LEDs should rotate each iteration?
//   /**
//    * Section(s) of lit LEDs moving through the strip
//    * Size: 2xCOLOR + 4
//    * Syntax: <COLOR><10ms><COLOR><n><L><o>
//    *  - H = Hue
//    *  - V = Value/brightness
//    *  - First pair = Moving color
//    *  - Second pair = Background color
//    *  - n = Amount of sections
//    *  - L = LEDs per section
//    *  - o = Options:
//    *    - bit 0: Reverse (1 = end -> start)
//    *    - bit 1: Comet mode (1 = "tail decreases in brightess")
//    * Caveats:
//    *  - IF V1==0: randomize H
//    *  - IF V1==0 && H1==0: rainbow H // XXX: Add this.
//    */
//   CHASE = DLUX_LED_SCENE_AMOUNT,
//   CHASE_RGB = 26,
//   CHASE_H = 46,
// };

// type ColorType = IRGB | IHV | IH;

// interface IDluxLED {
//   scene: SceneType;
//   colors: ColorType[];
// }

type Color = RGB | HV | number;
type Pattern = [Color, number][];
// type ColorArray = RGB[] | HV[];

interface DluxLed {
  scene: number;
  data: Buffer;
}

class InternalLedData {
  private bytes: number[] = [];
  private scene: number = 1;
  private colorType: number = 0;

  constructor() {}

  public setScene = (scene: number) => this.scene = scene;

  public addByte = (value: number) => this.bytes.push(Math.min(Math.max(value, 0), 255));

  public addColor = (color: Color) => {
    const c = Array.isArray(color) ? color : [color];

    if (!this.colorType) {
      this.colorType = c.length;
    } else if (this.colorType !== c.length) {
      throw("Color type mismatch");
    }

    c.forEach(c => this.addByte(c));
  }

  public build = (): DluxLed => {
    let s = this.scene;
    switch (this.colorType) {
      case 0:
        if (this.bytes.length) {
          throw("No color added");
        }
        break;

      case 1:
        s += 40;
        break;

      case 3:
        s += 20;
        break;

      default: break;
    }

    return {
      scene: s,
      data: Buffer.from(this.bytes),
    };
  }
}

interface IScene {
  type: SceneType;
  color?: Color;
  pattern?: Pattern;
}

export interface ISceneStatic extends IScene {
  type: "STATIC";
  color: Color;
}

export interface IScenePattern extends IScene {
  type: "PATTERN";
  pattern: Pattern;
}

export const encode = (o?: IScene): DluxLed => {
  // OFF
  if (!o) {
    return {
      scene: 1, 
      data: Buffer.from(""),
    };
  }

  const d = new InternalLedData();

  switch (o.type) {
    case "STATIC":
      d.setScene(1);
      if (!o.color) {
        throw("No color provided for STATIC scene");
      }

      d.addColor(o.color);
      break;

    case "PATTERN":
      d.setScene(2);
      if (!o.pattern) {
        throw("No pattern provided for PATTERN scene");
      }

      o.pattern.forEach(p => {
        if (p[1] <= 0) return;

        d.addColor(p[0]);
        d.addByte(p[1]);
      });
      break;

    default:
      throw(`Unsupported scene "${o.type}"`);
  }

  return d.build();
}
