type Callback = (payload: Buffer, topic: string) => void;
type CallbackReversed = (topic: string, payload: Buffer) => void;

export interface IDluxSubscription {
  topic: string;
  callback: Callback;
}

interface IClientBase {
  publish(topic: string, payload: Buffer | string): void;
}

export interface IDluxMqttClientInternalHandling extends IClientBase {
  subscribe(topic: string): void;
  addListener(event: "message", callback: CallbackReversed): void;
}

export interface IDluxMqttClientExternalHandling extends IClientBase {
  addSubscription(topic: string, callback: Callback): void;
}

export type IDluxMqttClient = IDluxMqttClientInternalHandling | IDluxMqttClientExternalHandling;

export interface IDluxLogger {
  info: (msg: any) => void;
  warn: (msg: any) => void;
  error: (msg: any) => void;
  fatal: (msg: any) => void;
}

export type DluxInput = number | boolean | undefined;
export type DluxOutput = boolean | undefined;

export enum DluxEventSource {
  DLUX_BUTTON = "D",
  GPIO_INPUT = "I",
  GIPO_OUTPUT = "O",
}

export interface IDluxEvent {
  source: DluxEventSource;
  n: number;
  value: number;
}
