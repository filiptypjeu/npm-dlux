import { DluxLampCommand } from "../lamp/enums";
import { DluxLamp } from "../lamp/interfaces";
import { DluxMqttDevice } from "./DluxMqttDevice";
import { IDluxMqttClient, IDluxSubscription } from "./interfaces";
import { DluxEventCallbackSignature } from "./types";

export class DluxLampDevice extends DluxMqttDevice {
  private m_state: string = "";

  constructor(o: {
    // DluxMqttDevice
    name: string;
    topic: string;
    ha?: boolean;
    client?: IDluxMqttClient;
    eventCallback?: DluxEventCallbackSignature;
  }) {
    super(o);
  }

  /**
   * Get the topic in which the device publishes its current state.
   */
  public get lampsTopic(): string {
    return this.topic + "/lamps";
  }
  /**
   * Get the topic in which the device can be sent lamp commands.
   */
  public get lampTopic(): string {
    return this.topic + "/l";
  }

  /**
   * Get the current state of the LED device.
   */
  public get state(): string {
    return this.m_state;
  }

  protected override get deviceSubscriptions(): IDluxSubscription[] {
    return [
      {
        topic: this.lampsTopic,
        callback: msg => (this.m_state = msg.toString()),
      },
    ];
  }

  public setLamp(lamp: DluxLamp): void {
    if (lamp.index < 0) return;
    this._publish(`${this.lampTopic}/${lamp.index + 1}`, lamp.state);
  }

  public setLamps(lamps: DluxLamp[]): void {
    if (!lamps.length) return;

    if (lamps.length === 1) {
      this.setLamp(lamps[0]);
      return;
    }

    const a: DluxLampCommand[] = [];
    for (const lamp of lamps) {
      if (lamp.index < 0) continue;
      a[lamp.index] = lamp.state;
    }

    this._publish(this.lampTopic, a.map(s => (s ? s : DluxLampCommand.NO_CHANGE)).join(""));
  }
}
