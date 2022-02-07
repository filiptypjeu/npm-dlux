export enum ColorType {
  ERROR = -1,
  Hue = 1,
  HV = 2,
  RGB = 3,
  RGBW = 4,
}
export enum SceneType {
  ERROR = -1,
  OFF = 0,
  STATIC = 1,
  PATTERN = 2,
  SWAP = 3,
  FLOW = 4,
  STROBE = 5,
  CHASE = 6,
}
export enum LedAction {
  BLACKOUT = 0,
  ON = 1,
  RESTART = 2,
  PAUSE = 3,
  ROTATE = 4,
  STEP = 5,
}
