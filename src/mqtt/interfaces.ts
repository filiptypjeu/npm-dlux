import { DluxEventSource } from "./enums";

export interface IDluxSubscription {
  topic: string;
  callback: (paylaod: Buffer) => void;
}

interface IClientBase {
  publish(topic: string, payload: Buffer | string): void;
}

export interface IDluxMqttClientInternalHandling extends IClientBase {
  subscribe(topic: string): void;
  addListener(event: "message", callback: (topic: string, payload: Buffer) => void): void;
}

export interface IDluxMqttClientExternalHandling extends IClientBase {
  addSubscription(topic: string, callback: (payload: Buffer) => void): void;
}

export type IDluxMqttClient = IDluxMqttClientInternalHandling | IDluxMqttClientExternalHandling;

export interface IDluxEvent {
  source: DluxEventSource;
  n: number;
  value: number;
}
