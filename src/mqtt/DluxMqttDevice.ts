import { MqttDevice } from "./MqttDevice";
import { DluxEventSource, IDluxSubscription, IDluxEvent, DluxInput, DluxOutput } from "./types";

const INPUTS = 8;
const OUTPUTS = 8;

type BaseOptions = Omit<ConstructorParameters<typeof MqttDevice>[0], "statusTopic" | "statusCallback">;
interface Callbacks {
  status?: (newStatus: string) => void;
  inputs?: (newInputs: DluxInput[]) => void;
  outputs?: (newOutputs: DluxOutput[]) => void;
  events?: (event: IDluxEvent) => void;
}
interface Options extends BaseOptions {
  topic: string,
  callbacks?: Callbacks,
}

export class DluxMqttDevice<C extends Callbacks = Callbacks> extends MqttDevice {
  public readonly topic: string;
  public inputs: DluxInput[] = new Array(INPUTS).fill(undefined); // XXX: Change to dynamic size?
  public outputs: DluxOutput[] = new Array(OUTPUTS).fill(undefined); // XXX: Change to dynamic size?
  public status: string = "offline"; // XXX: Enum?
  public version: string = "";

  protected m_callbacks: C;

  constructor(o: Options) {
    super({ ...o });
    this.topic = o.topic;
    this.m_callbacks = o.callbacks as any || {};
  }

  public get online(): boolean {
    return this.status === "online";
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    const subs = super.deviceSubscriptions().concat([
      {
        topic: this.topic + "/status",
        callback: payload => {
          const s = payload.toString();
          this.status = s;
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
    ]);
  
    if (this.m_callbacks.events) {
      subs.push({
        topic: this.topic + "/events",
        callback: payload => {
          const a = payload.toString().split(":");
          if (this.m_callbacks.events) this.m_callbacks.events({
            source: a[0] as DluxEventSource,
            n: Number(a[1]),
            value: Number(a[2]),
          });
        },
      });
    }

    return subs;
  }

  private parseInputs(payload: Buffer): void {
    const a = payload.toString().split(":").slice(0, 8).map(str => DluxMqttDevice.stringToValue(str));
    for (let i = 0; i < INPUTS; i++) {
      this.inputs[i] = a[i];
    }
  }

  private parseOutputs(payload: Buffer): void {
    const a = payload.toString().split("").slice(0, 8).map(str => DluxMqttDevice.stringToBool(str));
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
}
