import { IDluxMqttClient, IDluxSubscription, IDluxMqttClientExternalHandling, IDluxLogger } from "./types";

// XXX: Add HA support?

export abstract class MqttDevice {
  public readonly name: string;
  public readonly logger: IDluxLogger | undefined;

  protected readonly m_topic: string;
  private m_client: IDluxMqttClient | undefined;

  protected m_status: string = "offline";

  constructor(o: { name: string; topic: string; logger?: IDluxLogger }) {
    this.name = o.name;
    this.logger = o.logger;
    this.m_topic = o.topic;
  }

  protected _publish(topic: string, buffer: Buffer | string) {
    this.client.publish(topic, buffer);
  }

  protected _fatal(msg: string) {
    this.logger?.fatal(msg);
    throw new Error(msg);
  }

  /**
   * Get the device topic.
   */
  public get topic(): string {
    if (!this.m_topic) {
      throw this._fatal(`MqttDevice "${this.name}" does not have a topic"`);
    }
    return this.m_topic;
  }

  protected deviceSubscriptions(): IDluxSubscription[] {
    return [];
  }

  /**
   * Get all the subscriptions for this implementation.
   */
  public get subscriptions(): IDluxSubscription[] {
    return this.deviceSubscriptions();
  }

  /**
   * Get the MQTT client for this implementation.
   */
  public get client(): IDluxMqttClient {
    if (!this.m_client) {
      throw this._fatal(`MqttDevice "${this.name}" does not have an MQTT client"`);
    }
    return this.m_client;
  }

  /**
   * Initialize this implementation fully.
   *
   * The user need to call this manually after creating the device. We can not call this in the constructor since child subscriptions migth not be fully ready yet.
   */
  public initialize(client: IDluxMqttClient): this {
    this.m_client = client;
    const subs = this.subscriptions;

    const isExtrnal = (client: IDluxMqttClient): client is IDluxMqttClientExternalHandling => Boolean((client as any).addSubscription);

    if (isExtrnal(client)) {
      // Let the client handle all subscriptions and message callbacks
      subs.forEach(s => client.addSubscription(s.topic, s.callback));
    } else {
      // Add a separate listener for this device
      client.addListener("message", (t: string, p: Buffer) => {
        for (let i = 0; i < subs.length; i++) {
          const sub = subs[i];
          if (sub.topic === t) {
            sub.callback(p);
          }
        }
      });

      // Subscribe to all topics
      subs.forEach(s => client.subscribe(s.topic));
    }

    return this;
  }
}
