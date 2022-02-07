enum class ActionEnum : byte {
  BLACKOUT = 0,
  ON = 1,
  RESTART = 2,
  PAUSE = 3,
  ROTATE = 4,
  STEP = 5,
};

enum class SceneType : byte {
  OFF = 0,

  /**
   * Static color
   * Size: 1xCOLOR
   * Syntax: <COLOR>
   */
  STATIC = 1,

  /**
   * Set a static pattern
   * Size: N * (1xCOLOR + 1)
   * Syntax: <COLOR><n><COLOR><n>...
   *  - n = Amount of LEDs making up that section
   */
  PATTERN = 2,

  /**
   * Swap between different colors
   * Size: N * (1xCOLOR + 1)
   * Syntax: <COLOR><100ms><COLOR><100ms>...
   *  - 100ms = Time for the provided color
   * Caveats:
   *  - if only one color => randomize all colors
   */
  SWAP = 3,

  /**
   * Flow between different colors
   * Size: N * (1xCOLOR + 1)
   * Syntax: <COLOR><100ms><COLOR><100ms>...
   *  - 100ms = Time between provided colors
   * Caveats:
   *  - if only one color => randomize all colors
   */
  FLOW = 4,

  /**
   * Strobe
   * Size: 2xCOLOR + 3
   * Syntax: <COLOR><ms ON><COLOR><ms OFF><N>
   *  - First COLOR = ON color
   *  - Second COLOR = OFF color
   *  - ms ON/OFF = Time ON/OFF
   *  - N = Flashes
   */
  STROBE = 5,

  // XXX: Add parameter "steps", saying how many steps the LEDs should rotate each iteration?
  /**
   * Section(s) of lit LEDs moving through the strip
   * Size: 2xCOLOR + 3
   * Syntax: <COLOR><10ms><COLOR><n><L><o>
   *  - H = Hue
   *  - V = Value/brightness
   *  - First COLOR = Moving color
   *  - Second COLOR = Background color
   *  - n = Amount of sections
   *  - L = LEDs per section
   *  - o = Options:
   *    - bit 0: Reverse (1 = end -> start)
   *    - bit 1: Comet mode (1 = "tail decreases in brightess")
   *    - bit 2: Randomize COLOR 1
   *    - bit 3: Randomize COLOR 2
   */
  CHASE = 6,

  /**
   * Same as STATIC, but a random color
   * Size: 0
   */
  STATIC_RANDOM = 7,
};

/**
 * Color types. The enum values indicates their size too, which is nice.
 */
enum ColorType : byte {
  H = 1,
  HV = 2,
  RGB = 3,
  RGBW = DLUX_LED_COLOR_MAX_SIZE,
};
