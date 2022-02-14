// export type DluxInput = number | boolean | undefined;
// export type DluxOutput = boolean | undefined;

// XXX: Add HA support?

export interface IDluxSubscription {
  topic: string;
  callback: (paylaod: Buffer) => void;
}

export interface IDluxMqttClient {
  publish(topic: string, payload: Buffer | string): void;
  subscribe(topic: string): void;
  addListener(event: "message", callback: (topic: string, payload: Buffer) => void): void;
}

export class DluxMqttDevice {
  public readonly name: string;

  private readonly m_topic: string;
  private m_client: IDluxMqttClient | undefined;

  protected m_status: string = "offline";
  protected m_version: string = "";
  protected m_inputs: string = ":::::::";
  protected m_outputs: string = "--------";

  constructor(o: { name: string; topic: string; client?: IDluxMqttClient }) {
    this.name = o.name;
    this.m_topic = o.topic;
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
    this.client.subscribe(this.topic + "/+");
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
