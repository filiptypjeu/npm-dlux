import { status, encode, morse } from "./functions";
import { DluxMqttDevice } from "../mqtt/DluxMqttDevice";
import { DluxColorType, DluxSceneType, DluxLedAction } from "./enums";
import { DluxLedState, IScene, ISceneFlow, ISceneStatic, ISceneSwap } from "./interfaces";
import { Color, MS100, Swaps } from "./types";
import { DluxEventCallbackSignature, IDluxSubscription, IDluxLogger } from "../mqtt/types";

export class DluxLedDevice extends DluxMqttDevice {
  public readonly rgbw: boolean;

  private m_state: DluxLedState = {
    scene: DluxSceneType.ERROR,
    colorType: DluxColorType.ERROR,
    bufferSize: 0,
    sceneOn: false,
    sceneUpdating: false,
  };
  private m_buffer: Buffer = Buffer.from("");

  constructor(o: {
    // DluxMqttDevice
    name: string;
    topic: string;
    eventCallback?: DluxEventCallbackSignature;
    logger?: IDluxLogger;

    // Own
    rgbw?: boolean;
  }) {
    super(o);
    this.rgbw = o.rgbw || false;
  }

  /**
   * Get the topic in which the device publishes its current state.
   */
  public get on(): boolean {
    return this.state.sceneOn && this.state.powerOn !== false;
  }
  /**
   * Get the topic in which the device publishes its current state.
   */
  public get statesTopic(): string {
    return this.topic + "/states";
  }
  /**
   * Get the topic in which the device can be sent actions.
   */
  public get actionTopic(): string {
    return this.topic + "/a";
  }
  /**
   * Get the topic in which the device can be sent scenes.
   */
  public get sceneTopic(): string {
    return this.topic + "/s";
  }

  /**
   * Get the current state of the LED device.
   */
  public get state(): DluxLedState {
    return this.m_state;
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    return super.deviceSubscriptions().concat([
      {
        topic: this.statesTopic,
        callback: msg => (this.m_state = status(msg.toString())),
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
    this._publish(this.sceneTopic, this.m_buffer);
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
    this._publish(this.actionTopic, a.toString());
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
