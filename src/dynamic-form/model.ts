import type { FieldSpec } from './spec';

export type DynamicModelTerminal = {} | null;

export type DynamicModelGroup = { [k: string]: DynamicModel };

export type DynamicModelArray = DynamicModel[];

export type DynamicModel = DynamicModelTerminal | DynamicModelGroup | DynamicModelArray;

export function computeDataModel(
  spec: FieldSpec,
  prev?: { source: FieldSpec; value: DynamicModel },
): DynamicModel {
  if (!prev) {
    return extractInitial(spec);
  }
  const { source: prevSpec, value: prevModel } = prev;
  if (spec.kind === 'group' && prevSpec.kind === 'group') {
    assertDynamicModelGroup(prevModel);
    const result = copyTrackingSymbol(prevModel);
    for (const key in spec.children) {
      result[key] =
        key in prevModel
          ? computeDataModel(spec.children[key], {
              source: prevSpec.children[key],
              value: prevModel[key],
            })
          : computeDataModel(spec.children[key]);
    }
    return result;
  }
  if (spec.kind === 'array' && prevSpec.kind === 'array') {
    assertDynamicModelArray(prevModel);
    return prevModel.map((value) =>
      computeDataModel(spec.template, { source: prevSpec.template, value }),
    );
  }
  if (spec.kind === 'terminal' && prevSpec.kind === 'terminal') {
    return prevModel;
  }
  return extractInitial(spec);
}

export function extractInitial(spec: FieldSpec): DynamicModel {
  if (spec.kind === 'group') {
    const result: DynamicModelGroup = {};
    for (const key of Object.keys(spec.children)) {
      result[key] = extractInitial(spec.children[key]);
    }
    return result;
  }
  return spec.initial;
}

function assertDynamicModelGroup(model: DynamicModel): asserts model is DynamicModelGroup {
  if (!isDynamicModelGroup(model)) {
    throw Error('should be dynamic model object!');
  }
}

function assertDynamicModelArray(model: DynamicModel): asserts model is DynamicModelArray {
  if (!isDynamicModelArray(model)) {
    throw Error('should be dynamic model array!');
  }
}

// We don't spread the previous model since its keys may have completely changed.
// Therefore we need to know about and preserve the tracking symbol.
function copyTrackingSymbol<T extends { [k: PropertyKey]: unknown }>(from: T): T {
  const result = {} as T;
  for (const symbol of Object.getOwnPropertySymbols(from)) {
    (result as any)[symbol] = from[symbol];
  }
  return result;
}

function isDynamicModelGroup(model: DynamicModel): model is DynamicModelGroup {
  return model !== null && typeof model === 'object' && !Array.isArray(model);
}

function isDynamicModelArray(model: DynamicModel): model is DynamicModelArray {
  return Array.isArray(model);
}
