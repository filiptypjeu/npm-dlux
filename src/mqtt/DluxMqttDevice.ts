import { DluxEventReason, DluxEventSource } from "./enums";
import { IDluxMqttClient, IDluxSubscription, IDluxEvent } from "./interfaces";
import { DluxEventCallbackSignature } from "./types";

// XXX: Add HA support?

export class DluxMqttDevice {
  public readonly name: string;

  private readonly m_topic: string;
  private m_client: IDluxMqttClient | undefined;

  protected m_status: string = "offline";
  protected m_version: string = "";
  protected m_inputs: string = ":::::::";
  protected m_outputs: string = "--------";
  public m_eventCallback: DluxEventCallbackSignature | undefined;

  constructor(o: { name: string; topic: string; client?: IDluxMqttClient, eventCallback?: DluxEventCallbackSignature }) {
    this.name = o.name;
    this.m_topic = o.topic;
    this.m_eventCallback = o.eventCallback;
    if (o.client) this.initialize(o.client);
  }

  protected _publish(topic: string, buffer: Buffer | string) {
    this.client.publish(topic, buffer);
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
      throw new Error(`DluxMqttDevice "${this.name}" does not have a topic"`);
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
   * Get the topic in which the device publishes its log messages.
   */
  public get logTopic(): string {
    return this.topic + "/log";
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
        topic: this.logTopic,
        callback: payload => {
          const msg = payload.toString();
          if (!msg.startsWith("Version = ")) return;
          this.m_version = msg.split("Version = ")[1];
        },
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
          const event: IDluxEvent = {};

          const source = Object.values(DluxEventSource).find(e => e === a[0]);
          if (source) event.source = source;

          const reason = Object.values(DluxEventReason).find(e => e === a[2]);
          if (reason) event.reason = reason;

          const n = Number(a[1]);
          if (!Number.isNaN(n)) event.n = n;

          this.m_eventCallback!(event);
        }
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
      throw new Error(`DluxMqttDevice "${this.name}" does not have an MQTT client"`);
    }
    return this.m_client;
  }

  /**
   * Set the MQTT client for this implementation.
   */
  public set client(client: IDluxMqttClient) {
    this.m_client = client;
  }

  /**
   * Add a listener that calls the correct callback for subscriptions of this implementation.
   */
  public addListener(): this {
    this.client.addListener("message", (t: string, p: Buffer) => {
      const sub = this.subscriptions.find(s => s.topic === t);
      if (!sub) return;
      sub.callback(p);
    });
    return this;
  }

  /**
   * Subscribe to all device subtopics.
   */
  public subscribe(): this {
    this.subscriptions.forEach(s => this.client.subscribe(s.topic));
    return this;
  }

  /**
   * Request states from the device.
   */
  public requestStates(): this {
    this._publish(this.topic, "v"); // Version
    return this;
  }

  /**
   * Initialize this implementation fully (set client, add listeners, subscribe and request states).
   */
  public initialize(client: IDluxMqttClient): this {
    this.client = client;
    this.addListener();
    this.subscribe();
    this.requestStates();
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
