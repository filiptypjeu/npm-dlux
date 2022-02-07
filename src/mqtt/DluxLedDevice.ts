import { MqttClient } from "mqtt";
import { status, BLACK, encode, morse } from "../led/functions";
import { DluxMqttDevice, IDluxSubscription } from "./DluxMqttDevice";
import { ColorType, SceneType, LedAction } from "../led/enums";
import { DluxLedStatus, IScene, ISceneFlow, ISceneStatic } from "../led/interfaces";
import { Color } from "../led/types";

export class DluxLedDevice extends DluxMqttDevice {
  private m_state: DluxLedStatus = {
    scene: SceneType.ERROR,
    colorType: ColorType.ERROR,
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

  public send<C extends Color>(scene: IScene<C>): void {
    this.client.publish(this.sceneTopic, encode(scene));
  }

  public static(color: Color): void {
    const scene: ISceneStatic<Color> = { type: SceneType.STATIC, color };
    this.send(scene);
  }

  public fade(colors: Color[], time: number): void {
    const c: [Color, number][] = colors.map(c => [c, time]);
    const scene: ISceneFlow<Color> = {
      type: SceneType.FLOW,
      colors: c.concat(colors.length === 1 ? [BLACK(colors[0]), time] : []),
    };
    this.send(scene);
  }

  public morse(text: string, color: Color, color2: Color): void {
    this.client.publish(this.sceneTopic, morse(text, color, color2));
  }

  public action(a: LedAction): void {
    this.client.publish(this.actionTopic, Buffer.from([a]));
  }
}
