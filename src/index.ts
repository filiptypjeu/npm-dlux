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
  private scene: number = 1;
  private colorType: number = 0;

  constructor() {}

  public setScene = (scene: number) => (this.scene = scene);

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

  const d = new InternalLedData();

  switch (o.type) {
    case "STATIC":
      d.setScene(1);
      if (!o.color) {
        throw new Error("No color provided for STATIC scene");
      }

      d.addColor(o.color);
      break;

    case "PATTERN":
      d.setScene(2);
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
