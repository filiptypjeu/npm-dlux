import { DluxMqttDevice } from "../mqtt/DluxMqttDevice";
import { DluxEventCallbackSignature } from "../mqtt/types";
import { IDluxSubscription, IDluxLogger } from "../mqtt/interfaces";

export class DluxTempiraturDevice extends DluxMqttDevice {
  public order: string[] | undefined;

  private m_temps: (number | null)[] = [];

  constructor(o: {
    // DluxMqttDevice
    name: string;
    topic: string;
    eventCallback?: DluxEventCallbackSignature;
    logger?: IDluxLogger;

    // Own
    order?: string[];
  }) {
    super(o);
    this.order = o.order;
  }

  /**
   * Get the topic in which the device publishes the temperatures.
   */
  public get temperaturesTopic(): string {
    return this.topic + "/temps";
  }
  /**
   * Get the topic where the device can recieve text.
   */
  public get textTopic(): string {
    return this.topic + "/t";
  }

  /**
   * Get the current temperatures.
   */
  public get temperatures(): (number | null)[] {
    return this.m_temps;
  }
  /**
   * Get the current average temperature.
   */
  public get average(): number | null {
    let n = 0;
    let sum = 0;
    for (const temp of this.m_temps) {
      if (temp !== null) {
        n++;
        sum += temp;
      }
    }
    return n > 0 ? Math.round((100 * sum) / n) / 100 : null;
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    return super.deviceSubscriptions().concat([
      {
        topic: this.temperaturesTopic,
        callback: msg => this.parseTemperatureMessage(msg),
      },
    ]);
  }

  private parseTemperatureMessage(payload: Buffer) {
    const msg = payload.toString();

    // Get names and temperatures of the thermometers
    const names: string[] = msg.split(",").map(s => s.split(":")[0]);
    const temps: (number | null)[] = msg.split(",").map(s => {
      const value = s.split(":")[1];
      // If value is empty
      if (!value) {
        return null;
      }
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    });

    this.m_temps = this.order ? this.order.map(n => (names.includes(n) ? temps[names.indexOf(n)] : null)) : temps;
  }

  public print(row: number, text: string): void {
    this._publish(`${this.textTopic}/${row}`, text);
  }
}
