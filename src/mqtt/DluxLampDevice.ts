import { DluxLampCommand } from "../lamp/enums";
import { DluxLamp } from "../lamp/interfaces";
import { DluxMqttDevice } from "./DluxMqttDevice";
import { IDluxMqttClient, IDluxSubscription } from "./interfaces";
import { DluxEventCallbackSignature } from "./types";

export class DluxLampDevice extends DluxMqttDevice {
  private m_lamps: string = "";

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
   * Get the topic in which the device publishes its current lamp states.
   */
  public get lampsTopic(): string {
    return this.topic + "/lamps";
  }
  /**
   * Get the topic in which the device can be sent lamp commands.
   */
  public get setLampsTopic(): string {
    return this.topic + "/l";
  }

  /**
   * Get the current states of the lamps of this device.
   */
  public get lamps(): string {
    return this.m_lamps;
  }

  protected override get deviceSubscriptions(): IDluxSubscription[] {
    return [
      {
        topic: this.lampsTopic,
        callback: msg => (this.m_lamps = msg.toString()),
      },
    ];
  }

  public setLamp(lamp: DluxLamp): void {
    if (lamp.index < 0) return;
    this._publish(`${this.setLampsTopic}/${lamp.index + 1}`, lamp.state);
  }

  public setLamps(lamps: DluxLamp[]): void {
    if (!lamps.length) return;

    if (lamps.length === 1) {
      this.setLamp(lamps[0]);
      return;
    }

    // Search for the largest index
    let i = -1;
    for (const lamp of lamps) {
      if (lamp.index > i) {
        i = lamp.index;
      }
    }

    if (i < 0) {
      return;
    }

    const a = Array(i+1).fill(DluxLampCommand.NO_CHANGE);
    for (const lamp of lamps) {
      if (lamp.index < 0) continue;
      a[lamp.index] = lamp.state;
    }

    this._publish(this.setLampsTopic, a.join(""));
  }
}
