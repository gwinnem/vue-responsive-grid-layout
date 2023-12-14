import { TLayout } from "../src/components";

export const testLayoutOne: TLayout = [
  // test 1
  {
    i: 1,
    h: 2,
    w: 1,
    x: 0,
    y: 0,
    isDraggable: false,
    isResizable: false,
  },
  {
    i: 2,
    h: 1,
    w: 2,
    x: 1,
    y: 0
  },
  {
    i: 3,
    h: 2,
    w: 1,
    x: 2,
    y: 1
  },
  {
    i: 4,
    h: 2,
    w: 1,
    x: 3,
    y: 1,
    isStatic: true
  },
  {
    i: 5,
    h: 2,
    w: 1,
    x: 4,
    y: 0
  },
  {
    i: 6,
    h: 1,
    w: 1,
    x: 5,
    y: 0,
    isStatic: true
  },
  {
    i: 7,
    h: 3,
    w: 1,
    x: 0,
    y: 2,
    isDraggable: false,
    isResizable: false,
  },
  {
    i: 8,
    h: 1,
    w: 1,
    x: 1,
    y: 1,
    isStatic: true
  },

  // test 2
  // { h: 1, i: 1, w: 1, x: 0, y: 0 },
  // { h: 1, i: 2, w: 1, x: 1, y: 0 },
  // { h: 1, i: 3, w: 1, x: 2, y: 0 },
  // { h: 1, i: 4, w: 1, x: 3, y: 0 },
  // { h: 1, i: 5, w: 1, x: 4, y: 0 },
  // { h: 1, i: 6, w: 1, x: 0, y: 0 },
  // { h: 1, i: 7, w: 1, x: 1, y: 0 },
  // { h: 1, i: 8, w: 1, x: 2, y: 0 },

  // test 3
  // { x:0, y:0, w:2, h:2, i:0, isDraggable: false },
  // { x:2, y:0, w:2, h:2, i:1, isStatic: true },
  // { x:4, y:0, w:2, h:2, i:2, isResizable: false },
  // { x:0, y:2, w:2, h:2, i:3 },
  // { x:2, y:2, w:2, h:2, i:4 },
  // { x:4, y:2, w:2, h:2, i:5 },
  // { x:0, y:4, w:2, h:2, i:6 },
  // { x:2, y:4, w:2, h:2, i:7 },
  // { x:4, y:4, w:2, h:2, i:8 },
  // { x:0, y:6, w:2, h:2, i:9 },
  // { x:2, y:6, w:2, h:2, i:10 },
  // { x:4, y:6, w:2, h:2, i:11 },

  // test 4
  // { h: 1, i: 1, w: 1, x: 0, y: 0 },
  // { h: 1, i: 2, w: 1, x: 1, y: 0 },
  // { h: 1, i: 3, w: 1, x: 2, y: 0 },
  // { h: 1, i: 4, w: 1, x: 3, y: 0 },
  // { h: 1, i: 5, w: 2, x: 4, y: 0 },
  // { h: 4, i: 6, w: 4, x: 0, y: 1 },
  // { h: 2, i: 7, w: 2, x: 4, y: 1 },
  // { h: 2, i: 8, w: 2, x: 4, y: 3 },
];
