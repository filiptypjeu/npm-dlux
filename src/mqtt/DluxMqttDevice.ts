import { MqttDevice } from "./MqttDevice";
import { DluxEventSource, IDluxSubscription, IDluxEvent, DluxInput, DluxOutput } from "./types";

const INPUTS = 8;
const OUTPUTS = 8;

type Temperature = number | null;
type BaseOptions = Omit<ConstructorParameters<typeof MqttDevice>[0], "statusTopic" | "statusCallback">;
export interface DluxVariable {
  index: number;
  name: string;
  value: number;
  binary: string;
  defaultValue: number;
};

interface Callbacks {
  status?: (newStatus: string) => void;
  inputs?: (newInputs: DluxInput[]) => void;
  outputs?: (newOutputs: DluxOutput[]) => void;
  events?: (event: IDluxEvent) => void;
  temperatures?: (newTemps: Temperature[], newRaw: string) => void;
  text?: (row: number, newText: string) => void;
}
interface Options<C> extends BaseOptions {
  topic: string;
  thermometerOrder?: string[];
  callbacks?: C;
}

export class DluxMqttDevice<C extends Callbacks = Callbacks> extends MqttDevice {
  public readonly topic: string;
  public inputs: DluxInput[] = (new Array(INPUTS) as DluxInput[]).fill(undefined); // XXX: Change to dynamic size?
  public outputs: DluxOutput[] = (new Array(OUTPUTS) as DluxOutput[]).fill(undefined); // XXX: Change to dynamic size?
  public variables: DluxVariable[] = [];
  public readonly order: string[] | undefined;
  public temperatures: Temperature[];
  public text: { [row: number]: string | undefined } = {};
  public status: string = "offline"; // XXX: Enum?
  public version: string = "";

  protected m_callbacks: C;

  constructor(o: Options<C>) {
    super({ ...o });
    this.topic = o.topic;
    this.order = o.thermometerOrder;
    this.temperatures = (new Array(this.order?.length || 0) as Temperature[]).fill(null);
    this.m_callbacks = o.callbacks || ({} as C);
  }

  public get online(): boolean {
    return this.status === "online";
  }

  /**
   * Output text to display, if the device have one.
   */
  public print(row: number, text: string): void {
    this._publish(`t/${row}`, text);
  }

  public getVariable(nameOrIndex: string | number): DluxVariable | undefined {
    return typeof nameOrIndex === "number" ? this.variables.find(v => v.index === nameOrIndex) : this.variables.find(v => v.name === nameOrIndex);
  }

  public setVariable(nameOrIndex: string | number, value: number | string): void {
    const index = typeof nameOrIndex === "number" ? nameOrIndex : this.variables.find(v => v.name === nameOrIndex)?.index;
    if (!index) return this.logger?.warn(`Could not find variable ${index} on device ${this.name}`);
    this._publish(`${this.topic}/v/${index}`, value.toString());
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    // XXX: Avoid subscribing if not necessary?
    const subs = super.deviceSubscriptions().concat([
      {
        topic: this.topic + "/status",
        callback: payload => {
          const s = payload.toString();
          this.status = s;
          if (this.online) {
            this.variables = [];
            this._publish(this.topic + "/v", "");
          }
          if (this.m_callbacks.status) this.m_callbacks.status(s);
        },
      },
      {
        topic: this.topic + "/version",
        callback: payload => (this.version = payload.toString()),
      },
      {
        topic: this.topic + "/inputs",
        callback: payload => {
          this.parseInputs(payload);
          if (this.m_callbacks.inputs) this.m_callbacks.inputs(this.inputs);
        },
      },
      {
        topic: this.topic + "/outputs",
        callback: payload => {
          this.parseOutputs(payload);
          if (this.m_callbacks.outputs) this.m_callbacks.outputs(this.outputs);
        },
      },
      {
        topic: this.topic + "/events",
        callback: payload => {
          const a = payload.toString().split(":");
          if (this.m_callbacks.events)
            this.m_callbacks.events({
              source: a[0] as DluxEventSource,
              n: Number(a[1]),
              value: Number(a[2]),
            });
        },
      },
      {
        topic: this.topic + "/temps",
        callback: payload => {
          this.parseTemperatures(payload);
          if (this.m_callbacks.temperatures) this.m_callbacks.temperatures(this.temperatures, payload.toString());
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
      {
        topic: this.topic + "/variables/+",
        callback: (payload, topic) => {
          const index = Number(topic.split("/").reverse()[0]) || 0;
          if (!index) return;
          const [name, value, defaultValue] = payload.toString().split(":");
          const v = Number(value);
          this.cacheVariable({
            index,
            name,
            value: v,
            binary: Number.isNaN(v) ? "" : `00000000${v.toString(2)}`.slice(-8),
            defaultValue: Number(defaultValue),
          });
        },
      },
      {
        topic: this.topic + "/log",
        callback: payload => {
          const str = payload.toString().slice(5);
          if (str.startsWith("Variable ")) {
            const [_V, n, name, _E, value, defaultValue, _B, binary] = str.split(" ");
            const index = Number(n.slice(0, -1));
            if (!index || !name) return;
            this.cacheVariable({
              index,
              name,
              value: Number(value),
              binary: binary.slice(0, -1),
              defaultValue: Number(defaultValue.slice(1)),
            });
          }
        },
      },
    ]);

    return subs;
  }

  private cacheVariable(variable: DluxVariable): void {
    this.variables = this.variables.filter(v => v.index !== variable.index && v.name !== variable.name).concat(variable);
  }

  private parseInputs(payload: Buffer): void {
    const a = payload
      .toString()
      .split(":")
      .slice(0, 8)
      .map(str => DluxMqttDevice.stringToValue(str));
    for (let i = 0; i < INPUTS; i++) {
      this.inputs[i] = a[i];
    }
  }

  private parseOutputs(payload: Buffer): void {
    const a = payload
      .toString()
      .split("")
      .slice(0, 8)
      .map(str => DluxMqttDevice.stringToBool(str));
    for (let i = 0; i < OUTPUTS; i++) {
      this.outputs[i] = a[i];
    }
  }

  private static stringToBool(str: string): boolean | undefined {
    return str === "1" ? true : str === "0" ? false : undefined;
  }

  private static stringToValue(str: string): number | boolean | undefined {
    return str.length === 3 ? Number(str) : DluxMqttDevice.stringToBool(str);
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
      // XXX: this.temps = this.order.map(...)?
      for (let i = 0; i < this.order.length; i++) {
        const j = names.indexOf(this.order[i]);
        this.temperatures[i] = j >= 0 ? temps[j] : null;
      }
    } else {
      this.temperatures = temps;
    }
  }
}
