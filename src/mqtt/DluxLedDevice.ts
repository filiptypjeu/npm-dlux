import { MqttClient } from "mqtt";
import { status, encode, morse, statusToString } from "../led/functions";
import { DluxMqttDevice, IDluxSubscription } from "./DluxMqttDevice";
import { DluxColorType, DluxSceneType, DluxLedAction } from "../led/enums";
import { DluxLedStatus, IScene, ISceneFlow, ISceneStatic, ISceneSwap } from "../led/interfaces";
import { Color, MS100, Swaps } from "../led/types";

export class DluxLedDevice extends DluxMqttDevice {
  private m_state: DluxLedStatus = {
    scene: DluxSceneType.ERROR,
    colorType: DluxColorType.ERROR,
    bufferSize: 0,
    sceneOn: false,
    sceneUpdating: false,
  };
  private m_buffer: Buffer = Buffer.from("");

  constructor(name: string, topic: string, public readonly rgbw: boolean = true, client?: MqttClient) {
    super(name, topic, client);
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
  public get state(): DluxLedStatus {
    return this.m_state;
  }

  public get statusString(): string {
    let s = `${this.name} `;
    if (!this.online) {
      s += "is offline";
    } else if (this.state.powerOn === false) {
      s += "is powerless";
    } else if (this.state.dataOn === false) {
      s += "can not be controlled";
    } else if (!this.state.sceneOn) {
      s += "= BLACKOUT";
    } else {
      s += `= ${statusToString(this.state)}`;
    }
    return s;
  }

  protected override get deviceSubscriptions(): IDluxSubscription[] {
    return [
      {
        topic: this.statesTopic,
        callback: msg => (this.m_state = status(msg.toString())),
      },
    ];
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
      device.static(this.state.color!);
      return;
    }

    if (this.isBufferUpToDate()) {
      device.scene(this.m_buffer);
      return;
    }
  }
}
