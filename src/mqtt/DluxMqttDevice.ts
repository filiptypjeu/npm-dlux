import { MqttDevice } from "./MqttDevice";
import { DluxEventSource, IDluxSubscription, IDluxLogger, DluxEventCallbackSignature } from "./types";

// XXX: Add HA support?

export class DluxMqttDevice extends MqttDevice {
  protected m_version: string = "";
  protected m_inputs: string = ":::::::";
  protected m_outputs: string = "--------";
  public readonly m_eventCallback: DluxEventCallbackSignature | undefined;

  constructor(o: {
    // MqttDevice
    name: string;
    topic: string;
    logger?: IDluxLogger;

    // Own
    eventCallback?: DluxEventCallbackSignature;
  }) {
    super(o);
    this.m_eventCallback = o.eventCallback;
  }

  /**
   * Get online status for the device.
   */
  public get status(): string {
    return this.m_status;
  }
  /**
   * Get online status for the device.
   */
  public get online(): boolean {
    return this.m_status === "online";
  }
  /**
   * Get version of the device.
   */
  public get version(): string {
    return this.m_version;
  }

  /**
   * Get the topic in which the device publishes its status.
   */
  public get statusTopic(): string {
    return this.topic + "/status";
  }
  /**
   * Get the topic in which the device publishes its version.
   */
  public get versionTopic(): string {
    return this.topic + "/version";
  }
  /**
   * Get the topic in which the device publishes its output states.
   */
  public get outputsTopic(): string {
    return this.topic + "/outputs";
  }
  /**
   * Get the topic in which the device publishes its input states.
   */
  public get inputsTopic(): string {
    return this.topic + "/inputs";
  }
  /**
   * Get the topic in which the device publishes events.
   */
  public get eventsTopic(): string {
    return this.topic + "/events";
  }

  protected override deviceSubscriptions(): IDluxSubscription[] {
    let subs = super.deviceSubscriptions();

    if (!this.m_topic) {
      return subs;
    }

    subs = subs.concat([
      {
        topic: this.statusTopic,
        callback: payload => (this.m_status = payload.toString()),
      },
      {
        topic: this.versionTopic,
        callback: payload => (this.m_version = payload.toString()),
      },
      {
        topic: this.inputsTopic,
        callback: payload => (this.m_inputs = payload.toString()),
      },
      {
        topic: this.outputsTopic,
        callback: payload => (this.m_outputs = payload.toString()),
      },
    ]);

    if (this.m_eventCallback) {
      subs.push({
        topic: this.eventsTopic,
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
