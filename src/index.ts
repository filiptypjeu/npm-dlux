export type RGB = [number, number, number];
export type HV = [number, number];
type Color = RGB | HV | number;
type SceneType = "OFF" | "STATIC" | "PATTERN" | "SWAP" | "FLOW" | "STROBE" | "CHASE";
export type Pattern = [Color, number][];

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

interface DluxLed {
  scene: number;
  data: Buffer;
}

class InternalLedData {
  private bytes: number[] = [];
  private scene: number;
  private colorType: number = 0;

  constructor(scene: SceneType) {
    switch (scene) {
      case "OFF":
      case "STATIC":
        this.scene = 1;
        break;
      case "PATTERN":
        this.scene = 2;
        break;
      case "SWAP":
        this.scene = 3;
        break;
      case "FLOW":
        this.scene = 4;
        break;
      case "STROBE":
        this.scene = 5;
        break;
      case "CHASE":
        this.scene = 6;
        break;
      default:
        throw(`Invalid scene type "${scene}"`)
    }
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

      default:
        break;
    }

    return {
      scene: s,
      data: Buffer.from(this.bytes),
    };
  };
}

export const encode = (o?: IScene): DluxLed => {
  // OFF
  if (!o) {
    return {
      scene: 1,
      data: Buffer.from(""),
    };
  }

  const d = new InternalLedData(o.type);

  switch (o.type) {
    case "STATIC":
      if (!o.color) {
        throw new Error("No color provided for STATIC scene");
      }

      d.addColor(o.color);
      break;

    case "PATTERN":
      if (!o.pattern) {
        throw new Error("No pattern provided for PATTERN scene");
      }

      o.pattern.forEach(p => {
        if (p[1] <= 0) return;

        d.addColor(p[0]);
        d.addByte(p[1]);
      });
      break;

    default:
      throw new Error(`Unsupported scene "${o.type}"`);
  }

  return d.build();
};
