import { describe, expect, it } from 'vitest';
import { findCrossGridZoneAt, registerCrossGridZone } from '../src/core/gridlayout/helpers/cross-grid-registry';
import { ICrossGridZone } from '../src/core/gridlayout/interfaces/cross-grid.interfaces';

const makeZone = (overrides: Partial<ICrossGridZone> = {}): ICrossGridZone => ({
  acceptDrop: () => {},
  getRect: () => ({ bottom: 100, height: 100, left: 0, right: 100, top: 0, width: 100 } as DOMRect),
  isExternalDropDisabled: () => false,
  layoutId: `zone-a`,
  rejectDrop: () => {},
  ...overrides,
});

describe(`cross-grid-registry`, () => {
  it(`Should find a registered zone whose rect contains the given point`, () => {
    const unregister = registerCrossGridZone(makeZone({ layoutId: `zone-a` }));
    try {
      const found = findCrossGridZoneAt(50, 50, `some-other-id`);
      expect(found?.layoutId).toBe(`zone-a`);
    } finally {
      unregister();
    }
  });

  it(`Should return undefined when no registered zone's rect contains the point`, () => {
    const unregister = registerCrossGridZone(makeZone({ layoutId: `zone-b` }));
    try {
      const found = findCrossGridZoneAt(5000, 5000, `some-other-id`);
      expect(found).toBeUndefined();
    } finally {
      unregister();
    }
  });

  it(`Should never match a zone against its own excludeLayoutId (a grid can't drop onto itself)`, () => {
    const unregister = registerCrossGridZone(makeZone({ layoutId: `zone-c` }));
    try {
      const found = findCrossGridZoneAt(50, 50, `zone-c`);
      expect(found).toBeUndefined();
    } finally {
      unregister();
    }
  });

  it(`Should skip zones with no measurable rect (getRect returning null)`, () => {
    const unregister = registerCrossGridZone(makeZone({ getRect: () => null, layoutId: `zone-d` }));
    try {
      const found = findCrossGridZoneAt(50, 50, `some-other-id`);
      expect(found).toBeUndefined();
    } finally {
      unregister();
    }
  });

  it(`Should stop returning a zone once it's unregistered`, () => {
    const unregister = registerCrossGridZone(makeZone({ layoutId: `zone-e` }));
    unregister();

    const found = findCrossGridZoneAt(50, 50, `some-other-id`);
    expect(found).toBeUndefined();
  });

  it(`Should find the correct zone among multiple registered zones`, () => {
    const unregisterA = registerCrossGridZone(
      makeZone({ getRect: () => ({ bottom: 100, height: 100, left: 0, right: 100, top: 0, width: 100 } as DOMRect), layoutId: `left` }),
    );
    const unregisterB = registerCrossGridZone(
      makeZone({ getRect: () => ({ bottom: 100, height: 100, left: 200, right: 300, top: 0, width: 100 } as DOMRect), layoutId: `right` }),
    );
    try {
      expect(findCrossGridZoneAt(50, 50, `none`)?.layoutId).toBe(`left`);
      expect(findCrossGridZoneAt(250, 50, `none`)?.layoutId).toBe(`right`);
    } finally {
      unregisterA();
      unregisterB();
    }
  });
});
