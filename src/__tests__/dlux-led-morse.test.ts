import { morse } from "../led/functions";
import { DluxSceneType } from "../led/enums";

test("morse a HV", () => {
  expect(morse("aa", [0, 255], [0, 0], 1, 2, 3, 4, 5)).toEqual(
    Buffer.from([
      DluxSceneType.SWAP,
      2,

      // A = ._
      0,
      255,
      1, // .
      0,
      0,
      3, // space
      0,
      255,
      2, // -

      0,
      0,
      4, // letter space

      // A = ._
      0,
      255,
      1, // .
      0,
      0,
      3, // space
      0,
      255,
      2, // -

      0,
      0,
      5, // word space
    ])
  );
});

test("morse hello HV", () => {
  expect(morse("hello", [1, 1], [0, 0])).toEqual(
    Buffer.from([
      DluxSceneType.SWAP,
      2,

      // H = ....
      1,
      1,
      2, // .
      0,
      0,
      2, // space
      1,
      1,
      2, // .
      0,
      0,
      2, // space
      1,
      1,
      2, // .
      0,
      0,
      2, // space
      1,
      1,
      2, // .

      0,
      0,
      6, // letter space

      // E = .
      1,
      1,
      2, // .

      0,
      0,
      6, // letter space

      // L = .-..
      1,
      1,
      2, // .
      0,
      0,
      2, // space
      1,
      1,
      6, // -
      0,
      0,
      2, // space
      1,
      1,
      2, // .
      0,
      0,
      2, // space
      1,
      1,
      2, // .

      0,
      0,
      6, // letter space

      // L = .-..
      1,
      1,
      2, // .
      0,
      0,
      2, // space
      1,
      1,
      6, // -
      0,
      0,
      2, // space
      1,
      1,
      2, // .
      0,
      0,
      2, // space
      1,
      1,
      2, // .

      0,
      0,
      6, // letter space

      // L = ---
      1,
      1,
      6, // -
      0,
      0,
      2, // space
      1,
      1,
      6, // -
      0,
      0,
      2, // space
      1,
      1,
      6, // -

      0,
      0,
      14, // word space
    ])
  );
});

test("morse må$! RGBW", () => {
  expect(morse("må$!", [1, 2, 3, 4], [5, 6, 7, 8], 23)).toEqual(
    Buffer.from([
      DluxSceneType.SWAP,
      4,

      // M = --
      1,
      2,
      3,
      4,
      69, // -
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -

      5,
      6,
      7,
      8,
      69, // letter space

      // Å = .--.-
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -

      5,
      6,
      7,
      8,
      69, // letter space

      // $ = ···−··−
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -

      5,
      6,
      7,
      8,
      69, // letter space

      // ! = -.-.--
      1,
      2,
      3,
      4,
      69, // -
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      23, // .
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -
      5,
      6,
      7,
      8,
      23, // space
      1,
      2,
      3,
      4,
      69, // -

      5,
      6,
      7,
      8,
      161, // word space
    ])
  );
});
