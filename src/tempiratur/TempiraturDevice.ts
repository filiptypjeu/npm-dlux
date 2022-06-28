import { DluxMqttDevice } from "../mqtt/DluxMqttDevice";
import { IDluxSubscription } from "../mqtt/types";

type Temperature = number | null;

type BaseOptions = ConstructorParameters<typeof DluxMqttDevice>[0];
interface Callbacks extends NonNullable<BaseOptions["callbacks"]> {
  temperatures?: (newAverage: Temperature, newTemps: Temperature[]) => void;
  text?: (row: number, newText: string) => void;
}
interface Options extends BaseOptions {
  order?: string[];
  callbacks?: Callbacks;
}

export class DluxTempiraturDevice extends DluxMqttDevice<Callbacks> {
  public readonly order: string[] | undefined;
  public temperatures: Temperature[];
  public average: Temperature = null;
  public text: { [row: number]: string | undefined } = {};

  constructor(o: Options) {
    super(o);
    this.order = o.order;
    this.temperatures = (new Array(this.order?.length || 0) as Temperature[]).fill(null);
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    return super.deviceSubscriptions().concat([
      {
        topic: this.topic + "/temps",
        callback: payload => {
          this.parseTemperatures(payload);
          if (this.m_callbacks.temperatures) this.m_callbacks.temperatures(this.average, this.temperatures);
        },
      },
      {
        topic: this.topic + "/text/+",
        callback: (payload, topic) => {
          const row = Number(topic.split("/").reverse()[0]) || 0;
          if (!row) return;
          const s = payload.toString();
          this.text[row] = s;
          if (this.m_callbacks.text) this.m_callbacks.text(row, s);
        },
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
    this._publish(`t/${row}`, text);
  }
}
