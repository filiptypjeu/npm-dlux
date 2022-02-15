import { DluxEventSource } from "./enums";

export interface IDluxSubscription {
  topic: string;
  callback: (paylaod: Buffer) => void;
}

export interface IDluxMqttClient {
  publish(topic: string, payload: Buffer | string): void;
  subscribe(topic: string): void;
  addListener(event: "message", callback: (topic: string, payload: Buffer) => void): void;
}

export interface IDluxEvent {
  source: DluxEventSource;
  n: number;
  action: boolean;
}
