import type { Signal } from '@angular/core';
import {
  aggregateMetadata,
  applyEach,
  applyWhen,
  applyWhenValue,
  maxLength,
  minLength,
  reducedMetadataKey,
  required,
  schema,
  type SchemaPathTree,
} from '@angular/forms/signals';
import { extractInitial, type DynamicModel, type DynamicModelArray } from './model';
import {
  assertArrayFieldSpec,
  assertTerminalFieldSpec,
  lookupFieldSpec,
  type FieldSpec,
} from './spec';

export const LABEL = reducedMetadataKey(
  (_, next: string) => next,
  () => '',
);
export const ARRAY_ITEM_TEMPLATE = reducedMetadataKey<DynamicModel | undefined, DynamicModel>(
  (_: DynamicModel | undefined, next: DynamicModel) => next,
  () => undefined,
);
export const SPEC_KIND = reducedMetadataKey(
  (_: FieldSpec['kind'], next: FieldSpec['kind']) => next,
  () => 'terminal' as const,
);

export function createSchema(spec: Signal<FieldSpec>) {
  const dynamicSchema = schema((p: SchemaPathTree<DynamicModel>) => {
    aggregateMetadata(p, LABEL, ({ pathKeys }) => pathKeys()[pathKeys().length - 1] ?? '<root>');
    aggregateMetadata(p, SPEC_KIND, ({ pathKeys }) => lookupFieldSpec(spec(), pathKeys()).kind);
    applyWhen(
      p,
      ({ pathKeys }) => lookupFieldSpec(spec(), pathKeys()).kind === 'terminal',
      (terminal) => {
        required(terminal, {
          when: ({ pathKeys }) => {
            const s = lookupFieldSpec(spec(), pathKeys());
            assertTerminalFieldSpec(s);
            return s.validation.required;
          },
        });
      },
    );
    applyWhen(
      p,
      ({ pathKeys }) => lookupFieldSpec(spec(), pathKeys()).kind === 'array',
      (array) => {
        minLength(array as SchemaPathTree<DynamicModelArray>, ({ pathKeys }) => {
          const s = lookupFieldSpec(spec(), pathKeys());
          assertArrayFieldSpec(s);
          return s.validation.minLength;
        });
        maxLength(array as SchemaPathTree<DynamicModelArray>, ({ pathKeys }) => {
          const s = lookupFieldSpec(spec(), pathKeys());
          assertArrayFieldSpec(s);
          return s.validation.maxLength;
        });
        aggregateMetadata(array, ARRAY_ITEM_TEMPLATE, ({ pathKeys }) => {
          const s = lookupFieldSpec(spec(), pathKeys());
          assertArrayFieldSpec(s);
          return extractInitial(s.template);
        });
      },
    );
    applyWhenValue(
      p,
      (v) => v !== null && typeof v === 'object',
      (groupOrArray) => {
        applyEach(groupOrArray, dynamicSchema);
      },
    );
  });
  return dynamicSchema;
}
