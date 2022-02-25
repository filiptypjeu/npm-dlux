import { DluxEventSource } from "./enums";
import { IDluxMqttClient, IDluxSubscription, IDluxMqttClientExternalHandling, IDluxMqttClientInternalHandling, IDluxLogger } from "./interfaces";
import { DluxEventCallbackSignature } from "./types";

// XXX: Add HA support?

export class DluxMqttDevice {
  public readonly name: string;
  public readonly logger: IDluxLogger | undefined;

  private readonly m_topic: string;
  private m_client: IDluxMqttClient | undefined;

  protected m_status: string = "offline";
  protected m_version: string = "";
  protected m_inputs: string = ":::::::";
  protected m_outputs: string = "--------";
  public m_eventCallback: DluxEventCallbackSignature | undefined;

  constructor(o: { name: string; topic: string; client?: IDluxMqttClient; eventCallback?: DluxEventCallbackSignature, logger?: IDluxLogger }) {
    this.name = o.name;
    this.logger = o.logger;
    this.m_topic = o.topic;
    this.m_eventCallback = o.eventCallback;
    if (o.client) {
      this.initialize(o.client);
    }
  }

  protected _publish(topic: string, buffer: Buffer | string) {
    this.client.publish(topic, buffer);
  }

  protected _fatal(msg: string) {
    this.logger?.fatal(msg);
    throw new Error(msg);
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
   * Get the device topic.
   */
  public get topic(): string {
    if (!this.m_topic) {
      throw this._fatal(`DluxMqttDevice "${this.name}" does not have a topic"`);
    }
    return this.m_topic;
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

  protected get commonSubscriptions(): IDluxSubscription[] {
    if (!this.m_topic) {
      return [];
    }

    const subs: IDluxSubscription[] = [
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
    ];

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

  protected get deviceSubscriptions(): IDluxSubscription[] {
    return [];
  }

  /**
   * Get all the subscriptions for this implementation.
   */
  public get subscriptions(): IDluxSubscription[] {
    return this.commonSubscriptions.concat(this.deviceSubscriptions);
  }

  /**
   * Get the MQTT client for this implementation.
   */
  public get client(): IDluxMqttClient {
    if (!this.m_client) {
      throw this._fatal(`DluxMqttDevice "${this.name}" does not have an MQTT client"`);
    }
    return this.m_client;
  }

  /**
   * Initialize this implementation fully.
   */
  public initialize(client: IDluxMqttClient): this {
    this.m_client = client;

    if ((this.client as any).addSubscription) {
      const client = this.client as IDluxMqttClientExternalHandling;

      // Let the client handle all subscriptions and message callbacks
      this.subscriptions.forEach(s => client.addSubscription(s.topic, s.callback));

    } else {
      const client = this.client as IDluxMqttClientInternalHandling;

      // Add a separate listener for this device
      client.addListener("message", (t: string, p: Buffer) => {
        for (let i = 0; i < this.subscriptions.length; i++) {
          const sub = this.subscriptions[i];
          if (sub.topic === t) {
            sub.callback(p);
          }
        }
      });

      // Subscribe to all topics
      this.subscriptions.forEach(s => client.subscribe(s.topic));
    }

    return this;
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
