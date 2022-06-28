import { MqttDevice } from "./MqttDevice";
import { DluxEventSource, IDluxSubscription, IDluxLogger, DluxEventCallbackSignature } from "./types";

const INPUTS = 8;
const OUTPUTS = 8;

export class DluxMqttDevice extends MqttDevice {
  public readonly topic: string;
  public inputs: DluxInput[] = new Array(INPUTS).fill(undefined); // XXX: Change to dynamic size?
  public outputs: DluxOutput[] = new Array(OUTPUTS).fill(undefined); // XXX: Change to dynamic size?
  public status: string = "offline"; // XXX: Enum?
  public version: string = "";

  constructor(o: {
    // MqttDevice
    name: string;
    topic: string;
    logger?: IDluxLogger;

    // Own
    eventCallback?: DluxEventCallbackSignature;
  }) {
    super(o);
    this.topic = o.topic;
    this.m_eventCallback = o.eventCallback;
  }

  public get online(): boolean {
    return this.status === "online";
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    let subs = super.deviceSubscriptions();

    subs = subs.concat([
      {
        topic: this.topic + "/status",
        callback: payload => (this.m_status = payload.toString()),
      },
      {
        topic: this.topic + "/version",
        callback: payload => (this.m_version = payload.toString()),
      },
      {
        topic: this.topic + "/inputs",
        callback: payload => {
          this.parseInputs(payload);
        },
      },
      {
        topic: this.topic + "/outputs",
        callback: payload => {
          this.parseOutputs(payload);
        },
      },
    ]);

    if (this.m_eventCallback) {
      subs.push({
        topic: this.topic + "/events",
        callback: payload => {
          const a = payload.toString().split(":");
          this.m_eventCallback!({
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

  /**
   * Get the input states of the device.
   */
  public get inputs(): (number | boolean | undefined)[] {
    return this.m_inputs.split(":").map(str => DluxMqttDevice.stringToValue(str));
  }

  /**
   * Get the output states of the device.
   */
  public get outputs(): (boolean | undefined)[] {
    return this.m_outputs.split("").map(str => DluxMqttDevice.stringToBool(str));
  }
}
