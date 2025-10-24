import type {DynamicModel, DynamicModelTerminal} from './model';

export interface TerminalFieldSpec {
  kind: 'terminal';
  initial: DynamicModelTerminal;
  validation: {required: boolean};
}

export interface GroupFieldSpec {
  kind: 'group';
  children: {[key: string]: FieldSpec};
}

export interface ArrayFieldSpec {
  kind: 'array';
  initial: DynamicModel[];
  template: FieldSpec;
  validation: {minLength: number; maxLength: number};
}

export type FieldSpec = TerminalFieldSpec | GroupFieldSpec | ArrayFieldSpec;

export function lookupFieldSpec(spec: FieldSpec, keys: readonly string[]): FieldSpec {
  for (const key of keys) {
    if (spec.kind === 'array') {
      spec = spec.template;
    } else {
      assertGroupFieldSpec(spec);
      spec = spec.children[key];
    }
  }
  return spec;
}

export function assertTerminalFieldSpec(spec: FieldSpec): asserts spec is TerminalFieldSpec {
  if (spec.kind !== 'terminal') {
    throw Error('should be group field spec!');
  }
}

export function assertGroupFieldSpec(spec: FieldSpec): asserts spec is GroupFieldSpec {
  if (spec.kind !== 'group') {
    throw Error('should be group field spec!');
  }
}

export function assertArrayFieldSpec(spec: FieldSpec): asserts spec is ArrayFieldSpec {
  if (spec.kind !== 'array') {
    throw Error('should be array field spec!');
  }
}
