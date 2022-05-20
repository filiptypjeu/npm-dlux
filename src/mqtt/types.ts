export enum DluxEventSource {
  DLUX_BUTTON = "D",
  GPIO_INPUT = "I",
  GIPO_OUTPUT = "O",
}

export type DluxEventCallbackSignature = (event: IDluxEvent) => void;

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

export interface IDluxLogger {
  info: (msg: any) => void;
  warn: (msg: any) => void;
  error: (msg: any) => void;
  fatal: (msg: any) => void;
}

export interface IDluxEvent {
  source: DluxEventSource;
  n: number;
  value: number;
}
