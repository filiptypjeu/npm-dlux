import { BLACK } from "../index";

test("test BLACk", () => {
  expect(BLACK(255)).toEqual(0);
  expect(BLACK([4, 5])).toEqual([0, 0]);
  expect(BLACK([6, 7, 8])).toEqual([0, 0, 0]);
  expect(BLACK([9, 10, 11, 12])).toEqual([0, 0, 0, 0]);
});
