import { MqttClient } from "mqtt";
import { status, BLACK, encode, morse, statusToString } from "../led/functions";
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

  protected override get deviceSubscriptions(): IDluxSubscription[] {
    return [
      {
        topic: this.statesTopic,
        callback: msg => (this.m_state = status(msg.toString())),
      },
    ];
  }

  public override toString(): string {
    return `${this.name} = ${statusToString(this.state)}`;
  }

  public send<C extends Color>(scene: IScene<C>): void {
    this.client.publish(this.sceneTopic, encode(scene));
  }

  public static(color: Color): void {
    const scene: ISceneStatic<Color> = { type: DluxSceneType.STATIC, color };
    this.send(scene);
  }

  public swap(colors: Color[], time: MS100): void {
    const swaps: Swaps<Color> = colors.map(c => [c, time]);
    const scene: ISceneSwap<Color> = {
      type: DluxSceneType.SWAP,
      colors: swaps.concat(colors.length === 1 ? [BLACK(colors[0]), time] : []),
    };
    this.send(scene);
  }

  public flow(colors: Color[], time: MS100): void {
    const swaps: Swaps<Color> = colors.map(c => [c, time]);
    const scene: ISceneFlow<Color> = {
      type: DluxSceneType.FLOW,
      colors: swaps.concat(colors.length === 1 ? [BLACK(colors[0]), time] : []),
    };
    this.send(scene);
  }

  public morse(text: string, color: Color, color2: Color): void {
    this.client.publish(this.sceneTopic, morse(text, color, color2));
  }

  public action(a: DluxLedAction): void {
    this.client.publish(this.actionTopic, Buffer.from([a]));
  }
}
