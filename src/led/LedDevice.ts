import { status, encode, morse } from "./functions";
import { DluxMqttDevice } from "../mqtt/DluxMqttDevice";
import { DluxColorType, DluxSceneType, DluxLedAction } from "./enums";
import { DluxLedState, IScene, ISceneFlow, ISceneStatic, ISceneSwap } from "./interfaces";
import { Color, MS100, Swaps } from "./types";
import { IDluxSubscription } from "../mqtt/types";

type BaseOptions = ConstructorParameters<typeof DluxMqttDevice>[0];
interface Callbacks extends NonNullable<BaseOptions["callbacks"]> {
  state?: (newState: DluxLedState) => void;
}
interface Options extends BaseOptions {
  rgbw?: boolean;
  callbacks?: Callbacks;
}

export class DluxLedDevice extends DluxMqttDevice<Callbacks> {
  public readonly rgbw: boolean;
  public state: DluxLedState = {
    scene: DluxSceneType.ERROR,
    colorType: DluxColorType.ERROR,
    bufferSize: 0,
    sceneOn: false,
    sceneUpdating: false,
  };

  private m_buffer: Buffer = Buffer.from("");

  constructor(o: Options) {
    super(o);
    this.rgbw = o.rgbw || false;
  }

  /**
   * Get the topic in which the device publishes its current state.
   */
  public get on(): boolean {
    return this.state.sceneOn && this.state.powerOn !== false;
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    return super.deviceSubscriptions().concat([
      {
        topic: this.topic + "/states",
        callback: msg => {
          this.state = status(msg.toString());
          if (this.m_callbacks.state) this.m_callbacks.state(this.state);
        },
      },
    ]);
  }

  private isBufferUpToDate(): boolean {
    // Check if the last sent buffer
    return (
      this.state.scene === this.m_buffer[0] && this.state.colorType === this.m_buffer[1] && this.state.bufferSize === Math.max(0, this.m_buffer.length - 2)
    );
  }

  public scene<C extends Color>(scene: IScene<C> | Buffer): void {
    this.m_buffer = Buffer.isBuffer(scene) ? scene : encode(scene);
    this._publish(this.topic + "/s", this.m_buffer);
  }

  public static(color: Color): void {
    const scene: ISceneStatic<Color> = { type: DluxSceneType.STATIC, color };
    this.scene(scene);
  }

  public swap(colors: Color[], time: MS100): void {
    const swaps: Swaps<Color> = colors.map(c => [c, time]);
    const scene: ISceneSwap<Color> = {
      type: DluxSceneType.SWAP,
      colors: swaps,
    };
    this.scene(scene);
  }

  public flow(colors: Color[], time: MS100): void {
    const swaps: Swaps<Color> = colors.map(c => [c, time]);
    const scene: ISceneFlow<Color> = {
      type: DluxSceneType.FLOW,
      colors: swaps,
    };
    this.scene(scene);
  }

  public morse(text: string, color: Color, color2: Color): void {
    this.scene(morse(text, color, color2));
  }

  public action(a: DluxLedAction): void {
    this._publish(this.topic + "/a", a.toString());
  }

  public copyTo(device: DluxLedDevice): void {
    // Static information is easy to copy
    if (this.state.scene === DluxSceneType.STATIC) {
      device.static(this.state.color || [0, 0, 0, 0]);
      return;
    }

    if (this.isBufferUpToDate()) {
      device.scene(this.m_buffer);
      return;
    }
  }
}
