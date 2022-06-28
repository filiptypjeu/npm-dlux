import { DluxMqttDevice } from "../mqtt/DluxMqttDevice";
import { DluxEventCallbackSignature, IDluxSubscription, IDluxLogger } from "../mqtt/types";

type Temperature = number | null;

export class DluxTempiraturDevice extends DluxMqttDevice {
  public readonly order: string[] | undefined;
  public temperatures: Temperature[];
  public average: Temperature = null;

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
    this.temperatures = new Array(this.order?.length || 0).fill(null);
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    return super.deviceSubscriptions().concat([
      {
        topic: this.topic + "/temps",
        callback: payload => {
          this.parseTemperatures(payload);
        }
      },
    ]);
  }

  private parseTemperatures(payload: Buffer): void {
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

    if (this.order) {
      for (let i = 0; i < this.order.length; i++) {
        const j = names.indexOf(this.order[i]);
        if (j >= 0) this.temperatures[i] = temps[j];
      }
    } else {
      this.temperatures = temps;
    }

    let n = 0;
    let sum = 0;
    for (const temp of this.temperatures) {
      if (temp !== null) {
        n++;
        sum += temp;
      }
    }

    this.average = n > 0 ? Math.round((100 * sum) / n) / 100 : null;
  }

  public print(row: number, text: string): void {
    this._publish(`${this.textTopic}/${row}`, text);
  }
}
