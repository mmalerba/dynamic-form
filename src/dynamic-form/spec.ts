import type { Signal } from '@angular/core';
import {
  aggregateProperty,
  applyEach,
  applyWhenValue,
  reducedProperty,
  required,
  schema,
  type FieldState,
} from '@angular/forms/signals';

export interface TerminalFieldSpec {
  name: string;
  initial: string;
  validation: { required: boolean };
}

export interface GroupFieldSpec {
  name: string;
  children: FieldSpec[];
}

// TODO: ArrayFieldSpec?
export type FieldSpec = TerminalFieldSpec | GroupFieldSpec;

export function isGroup(spec: FieldSpec): spec is GroupFieldSpec {
  return (spec as GroupFieldSpec).children !== undefined;
}

export const LABEL = reducedProperty<string, string>(
  (_, item) => item,
  () => '',
);

// 🔪 Requires recursive schema
export function createSchema(spec: Signal<FieldSpec>) {
  const dynamicSchema = schema((p) => {
    applyWhenValue(
      p,
      (v) => Array.isArray(v),
      (group) => {
        aggregateProperty(group, LABEL, ({ state }) => lookupPath(spec(), state).name);
        applyEach(group, dynamicSchema);
      },
    );
    applyWhenValue(
      p,
      (v) => !Array.isArray(v),
      (terminal) => {
        aggregateProperty(terminal, LABEL, ({ state }) => lookupPath(spec(), state).name);
        required(terminal, {
          when: ({ state }) => {
            const s = lookupPath(spec(), state);
            assertTerminal(s);
            return s.validation.required;
          },
        });
      },
    );
  });
  return dynamicSchema;
}

// 🔪 Lots of asserts needed
export function lookupPath(spec: FieldSpec, state: FieldState<unknown>): FieldSpec {
  const keys = illegallyGetPathKeys(state);
  for (const key of keys) {
    assertGroup(spec);
    assertNumber(key);
    spec = spec.children[key];
  }
  return spec;
}

export function assertGroup(spec: FieldSpec): asserts spec is GroupFieldSpec {
  if (!isGroup(spec)) {
    throw Error('non group spec!');
  }
}

function assertTerminal(spec: FieldSpec): asserts spec is TerminalFieldSpec {
  if (isGroup(spec)) {
    throw Error('non terminal spec!');
  }
}

function assertNumber(key: string | number): asserts key is number {
  if (typeof key !== 'number') {
    // 🔪 `pathKeys` contains the array keys as numbers, so we can't even do this
    // throw Error('non numeric key!');
  }
}

// 🔪 `pathKeys` not exposed in API
function illegallyGetPathKeys(state: FieldState<unknown>): (number | string)[] {
  return (state as any).structure.pathKeys();
}
