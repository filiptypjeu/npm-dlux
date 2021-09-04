enum class ActionEnum : byte {
  BLACKOUT = 0,
  ON = 1,
  RESTART = 2,
  PAUSE = 3,
  ROTATE = 4,
  STEP = DLUX_LED_ACTION_AMOUNT,
};

enum class SceneEnum : byte {
  OFF = 0,

  /**
    * Static color
    * Size: 1xCOLOR
    * Syntax: <COLOR>
    *  OR
    * Syntax: <R><G><B>
    *  OR
    * Syntax: <H>
    *  - H = Hue
    *  - V = Value/brightness
    * Caveats:
    *  - IF V==0: randomize H
    */
  STATIC = 1,
  STATIC_RGB = 21,
  STATIC_HUE = 41,
  STATIC_RGBW = 61,

  /**
    * Set a static pattern
    * Size: N * (1xCOLOR + 1)
    * Syntax: <COLOR><n><COLOR><n>...
    *  - H = Hue
    *  - V = Value/brightness
    *  - n = Amount of LEDs making up that section
    */
  PATTERN = 2,
  PATTERN_RGB = 22,
  PATTERN_HUE = 42,
  PATTERN_RGBW = 62,

  /**
    * Swap between different colors
    * Size: N * (1xCOLOR + 1)
    * Syntax: <COLOR><100ms><COLOR><100ms>...
    *  - H = Hue
    *  - V = Value/brightness
    *  - 100ms = Time for the provided color
    * Caveats:
    *  - IF size==0: OFF
    *  - IF size==3: randomize all H's and use V = 0xff
    */
  SWAP = 3,
  SWAP_RGB = 23,
  SWAP_HUE = 43,
  SWAP_RGBW = 63,

  /**
    * Flow between different colors
    * Size: N * (1xCOLOR + 1)
    * Syntax: <COLOR><100ms><COLOR><100ms>...
    *  - H = Hue
    *  - V = Value/brightness
    *  - 100ms = Time between provided colors
    * Caveats:
    *  - IF size==0: OFF
    *  - IF size==3: randomize all H's and use V = 0xff
    */
  FLOW = 4,
  FLOW_RGB = 24,
  FLOW_HUE = 44,
  FLOW_RGBW = 64,

  /**
    * Strobe
    * Size: 2xCOLOR + 3
    * Syntax: <COLOR><ms ON><COLOR><ms OFF><N>
    *  - H = Hue
    *  - V = Value/brightness
    *  - First pair = ON color
    *  - Second pair = OFF color
    *  - ms ON/OFF = Time ON/OFF
    *  - N = Flashes
    * Caveats:
    *  - Basically a special case of SWAP with shorter intervals and a fixed amount of swaps
    */
  STROBE = 5,
  STROBE_RGB = 25,
  STROBE_HUE = 45,
  STROBE_RGBW = 65,

  // XXX: Add parameter "steps", saying how many steps the LEDs should rotate each iteration?
  /**
    * Section(s) of lit LEDs moving through the strip
    * Size: 2xCOLOR + 4
    * Syntax: <COLOR><10ms><COLOR><n><L><o>
    *  - H = Hue
    *  - V = Value/brightness
    *  - First pair = Moving color
    *  - Second pair = Background color
    *  - n = Amount of sections
    *  - L = LEDs per section
    *  - o = Options:
    *    - bit 0: Reverse (1 = end -> start)
    *    - bit 1: Comet mode (1 = "tail decreases in brightess")
    * Caveats:
    *  - IF V1==0: randomize H
    *  - IF V1==0 && H1==0: rainbow H // XXX: Add this.
    */
  CHASE = 6,
  CHASE_RGB = 26,
  CHASE_HUE = 46,
  CHASE_RGBW = 66,
};

/**
  * Color types. The enum values indicates their size too, which is nice.
  */
enum ColorType : byte {
  H = 1,
  HV = 2,
  RGB = 3,
  RGBW = 4,
};