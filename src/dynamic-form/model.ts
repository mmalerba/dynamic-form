import type { FieldTree } from '@angular/forms/signals';
import { isGroup, LABEL, type FieldSpec } from './spec';

export type TerminalDataModel = string;
export type GroupDataModel = (TerminalDataModel | GroupDataModel)[];
export type DynamicDataModel = TerminalDataModel | GroupDataModel;

// 🔪 Complicated computation
export function computeDataModel(
  src: FieldSpec,
  prev?: { source: FieldSpec; value: DynamicDataModel },
): DynamicDataModel {
  if (!prev) {
    return extractInitial(src);
  }
  const { source: prevSrc, value: prevValue } = prev;
  if (isGroup(src) && isGroup(prevSrc)) {
    const items = src.children.map((it) => {
      const prevItIdx = prevSrc.children.findIndex((prevIt) => it.name === prevIt.name);
      if (prevItIdx === -1) {
        return computeDataModel(it);
      }
      const prevItSrc = prevSrc.children[prevItIdx];
      const prevItValue = prevValue[prevItIdx];
      const newPrev =
        prevItSrc === undefined || prevItValue === undefined
          ? undefined
          : { source: prevItSrc, value: prevItValue };
      return computeDataModel(it, newPrev);
    });
    // 🔪 Transferring the magic tracking symbol.
    const newArr = Object.assign([], prevValue, items);
    newArr.length = items.length;
    return newArr;
  }
  if (!isGroup(src) && !isGroup(prevSrc)) {
    return prevValue;
  }
  return extractInitial(src);
}

function extractInitial(spec: FieldSpec): DynamicDataModel {
  if (isGroup(spec)) {
    return spec.children.map(extractInitial);
  }
  return spec.initial;
}

export function computeStructuredData(f: FieldTree<unknown>): unknown {
  if (isArrayForm(f)) {
    let entries = [];
    for (const child of f) {
      assertDefined(child);
      const name = child().property(LABEL)();
      const value = computeStructuredData(child);
      entries.push([name, value]);
    }
    return Object.fromEntries(entries);
  } else {
    return f().value();
  }
}

// 🔪 Should `Array.isArray` work directly on the proxy?
export function isArrayForm(f: FieldTree<unknown>): f is FieldTree<unknown[]> {
  return Array.isArray(f().value());
}

function assertDefined<T>(v: T | undefined): asserts v is T {
  if (v === undefined) throw Error('undefined');
}
