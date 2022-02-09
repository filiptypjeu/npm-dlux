import { MqttClient } from "mqtt";

// export type DluxInput = number | boolean | undefined;
// export type DluxOutput = boolean | undefined;

export interface IDluxSubscription {
  topic: string;
  callback: (paylaod: Buffer) => void;
}

export class DluxMqttDevice {
  private m_topic: string;

  protected m_status: string = "offline";
  protected m_version: string = "";
  protected m_client: MqttClient | undefined;
  protected m_inputs: string = ":::::::";
  protected m_outputs: string = "--------";

  constructor(public readonly name: string, topic?: string, client?: MqttClient) {
    this.m_topic = topic || "";
    if (client) this.initialize(client);
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

  protected get commonSubscriptions(): IDluxSubscription[] {
    if (!this.m_topic) {
      return [];
    }

    return [
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
  public get client(): MqttClient {
    if (!this.m_client) {
      throw new Error(`DluxMqttDevice "${this.name}" does not have an MQTT client"`);
    }
    return this.m_client;
  }

  /**
   * Set the MQTT client for this implementation.
   */
  public set client(client: MqttClient) {
    this.m_client = client;
  }

  /**
   * Add listeners for all subscriptions of this implementation.
   */
  public addListeners(): this {
    this.subscriptions.forEach(s =>
      this.client.addListener("message", (t: string, p: Buffer) => {
        if (t === s.topic) s.callback(p);
      })
    );
    return this;
  }

  /**
   * Subsctibe to all subscription topics of this implementation.
   */
  public subscribe(): this {
    this.subscriptions.forEach(s => this.client.subscribe(s.topic));
    return this;
  }

  /**
   * Request states from the device.
   */
  public requestStates(): this {
    this.client.publish(this.topic, "s"); // States
    this.client.publish(this.topic, "g"); // GPIO inputs and outputs
    return this;
  }

  /**
   * Initialize this implementation fully (set client, add listeners, subscribe and request states).
   */
  public initialize(client: MqttClient): this {
    this.client = client;
    this.addListeners();
    this.subscribe();
    this.requestStates();
    return this;
  }

  private stringToBool(str: string): boolean | undefined {
    return str === "1" ? true : str === "0" ? false : undefined;
  }

  private stringToValue(str: string): number | boolean | undefined {
    return str.length === 3 ? Number(str) : this.stringToBool(str);
  }

  /**
   * Get the input states of the device.
   */
  public get inputs(): (number | boolean | undefined)[] {
    return this.m_inputs.split(":").map(str => this.stringToValue(str));
  }

  /**
   * Get the output states of the device.
   */
  public get outputs(): (boolean | undefined)[] {
    return this.m_outputs.split("").map(str => this.stringToBool(str));
  }
}
