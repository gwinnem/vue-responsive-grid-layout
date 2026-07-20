<template>
  <ExampleDemo title="Cross-grid drop restrictions">
    <template #description>
      Items can be dragged between any grid that has
      <code>allowCrossGridDrag</code> set — toggle each grid below
      independently to see dragging confine itself back to within a grid
      once its own toggle is off. <strong>Archive (read-only)</strong>
      also sets <code>disableExternalDrop</code> when its own toggle is
      on: dragging an item there rejects the drop and fires
      <code>cross-grid-drop-rejected</code> on that grid instead of moving
      anything, rather than failing silently. A successful drop elsewhere
      fires <code>cross-grid-item-dropped</code>. Both are logged below.
      Each grid keeps a minimum height so it stays a usable drop target
      even once emptied out; toggle <code>preventCollision</code> to
      compare the default push-aside-on-overlap behavior against blocking
      the move entirely instead.
    </template>
    <template #controls>
      <ExampleToggle v-model="teamAEnabled" label="Team A: allow cross-grid drag" />
      <ExampleToggle v-model="teamBEnabled" label="Team B: allow cross-grid drag" />
      <ExampleToggle v-model="archiveEnabled" label="Archive: allow cross-grid drag" />
      <ExampleToggle v-model="archiveRejects" label="Archive: reject external drops" />
      <ExampleToggle v-model="preventCollision" label="preventCollision" />
    </template>

    <div class="grids">
      <div>
        <p class="grid-label">Team A</p>
        <GridLayout v-model:layout="teamA" :allow-cross-grid-drag="teamAEnabled" layout-id="team-a" :col-num="2" :row-height="60"
          :prevent-collision="preventCollision"
          @cross-grid-item-dropped="onDropped('Team A', $event)" @cross-grid-drop-rejected="onRejected('Team A', $event)">
          <GridItem v-for="item in teamA" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item example-item--c6">{{ item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
      <div>
        <p class="grid-label">Team B</p>
        <GridLayout v-model:layout="teamB" :allow-cross-grid-drag="teamBEnabled" layout-id="team-b" :col-num="2" :row-height="60"
          :prevent-collision="preventCollision"
          @cross-grid-item-dropped="onDropped('Team B', $event)" @cross-grid-drop-rejected="onRejected('Team B', $event)">
          <GridItem v-for="item in teamB" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item example-item--c1">{{ item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
      <div>
        <p class="grid-label">Archive (read-only)</p>
        <GridLayout v-model:layout="archive" :allow-cross-grid-drag="archiveEnabled" :disable-external-drop="archiveRejects" layout-id="archive"
          :col-num="2" :row-height="60" :prevent-collision="preventCollision" @cross-grid-item-dropped="onDropped('Archive', $event)"
          @cross-grid-drop-rejected="onRejected('Archive', $event)">
          <GridItem v-for="item in archive" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item example-item--c4">{{ item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
    </div>

    <div class="drop-log" data-testid="drop-log">
      <p class="grid-label">Log</p>
      <div v-if="log.length === 0" class="drop-log__empty">Drag an item between grids to see events here.</div>
      <div v-for="(entry, idx) in log" :key="idx" class="drop-log__entry" :class="`drop-log__entry--${entry.kind}`">
        {{ entry.message }}
      </div>
    </div>

    <template #footer>
      <LayoutJsonViewer label="Team A" :layout="teamA" />
      <LayoutJsonViewer label="Team B" :layout="teamB" />
      <LayoutJsonViewer label="Archive" :layout="archive" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const teamAEnabled = ref(true);
const teamBEnabled = ref(true);
const archiveEnabled = ref(true);
const archiveRejects = ref(true);
const preventCollision = ref(false);

const teamA = ref<TLayout>([
  { h: 2, i: 'A1', w: 2, x: 0, y: 0 },
  { h: 2, i: 'A2', w: 2, x: 0, y: 2 },
]);
const teamB = ref<TLayout>([{ h: 2, i: 'B1', w: 2, x: 0, y: 0 }]);
const archive = ref<TLayout>([{ h: 2, i: 'Locked', w: 2, x: 0, y: 0, isStatic: true }]);

const log = ref<{ kind: 'dropped' | 'rejected'; message: string }[]>([]);
const addLogEntry = (kind: 'dropped' | 'rejected', message: string): void => {
  log.value = [{ kind, message }, ...log.value].slice(0, 6);
};

const onDropped = (targetName: string, payload: { item: { i: string | number }; sourceLayoutId: string }): void => {
  addLogEntry('dropped', `"${payload.item.i}" moved into ${targetName} (from ${payload.sourceLayoutId}).`);
};

const onRejected = (targetName: string, payload: { itemId: string | number; sourceLayoutId: string }): void => {
  addLogEntry(
    'rejected',
    `${targetName} rejected "${payload.itemId}" from ${payload.sourceLayoutId} — this grid doesn't accept drops.`,
  );
};
</script>

<style scoped>
.grids {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, 1fr);
}

.grids .vue-grid-layout {
  min-height: 140px;
}

.grid-label {
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.drop-log {
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 20px;
  padding-top: 16px;
}

.drop-log__empty {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.drop-log__entry {
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  margin-bottom: 4px;
  padding: 6px 10px;
}

.drop-log__entry--dropped {
  background-color: var(--vp-c-brand-soft);
}

.drop-log__entry--rejected {
  background-color: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

@media (width <= 768px) {
  .grids {
    grid-template-columns: 1fr;
  }
}
</style>
