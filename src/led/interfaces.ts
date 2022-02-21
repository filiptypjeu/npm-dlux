import { DluxColorType, DluxSceneType } from "./enums";
import { Color, ColorNumber, Leds, MS, MS10, Pattern, RGBW, Swaps } from "./types";

export interface IScene<T extends Color> extends Object {
  type: DluxSceneType;
  // colorType?: ColorType;
  color?: T;
  color2?: T;
  colors?: ColorNumber<T>[];
  time?: number;
  time2?: number;
  pulses?: number;
  sections?: number;
  ledsPerSection?: number;
  reverse?: boolean;
  comet?: boolean;
}

export interface ISceneStatic<T extends Color> extends IScene<T> {
  type: DluxSceneType.STATIC;
  color: T;
}

export interface IScenePattern<T extends Color> extends IScene<T> {
  type: DluxSceneType.PATTERN;
  colors: Pattern<T>;
}

export interface ISceneSwap<T extends Color> extends IScene<T> {
  type: DluxSceneType.SWAP;
  colors: Swaps<T>;
}

export interface ISceneFlow<T extends Color> extends IScene<T> {
  type: DluxSceneType.FLOW;
  colors: Swaps<T>;
}

export interface ISceneStrobe<T extends Color> extends IScene<T> {
  type: DluxSceneType.STROBE;
  color: T;
  color2: T;
  time: MS;
  time2: MS;
  pulses: number;
}

export interface ISceneChase<T extends Color> extends IScene<T> {
  type: DluxSceneType.CHASE;
  color: T;
  color2: T;
  time: MS10;
  sections: number;
  ledsPerSection: Leds;
  reverse?: boolean;
  comet?: boolean;
}

export interface DluxLedState {
  scene: DluxSceneType;
  colorType: DluxColorType;
  bufferSize: number;
  powerOn?: boolean;
  dataOn?: boolean;
  sceneOn: boolean;
  sceneUpdating: boolean;
  color?: RGBW;
}
