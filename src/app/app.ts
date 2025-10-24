import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import { DynamicForm } from '../dynamic-form/components';
import { assertGroupFieldSpec, lookupFieldSpec, type FieldSpec } from '../dynamic-form/spec';

interface AddInfo {
  name: string;
  initial: string;
  required: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DynamicForm, Field, JsonPipe],
  template: `
    <h1>Dynamic Form</h1>

    <h2>Editor</h2>
    <h3>Remove:</h3>
    <label>Name<input [field]="removeForm" /></label>
    <button (click)="remove()">remove</button>

    <h3>Add:</h3>
    <label>Name<input [field]="addForm.name" /></label>
    <label>Initial value<input [field]="addForm.initial" /></label>
    <label>Required<input type="checkbox" [field]="addForm.required" /></label>
    <button (click)="add()">add</button>

    <h3>Reorder:</h3>
    <button (click)="shuffle()">shuffle order</button>

    <h2>Form</h2>
    <dynamic-form [spec]="form().value()" (valueChange)="userInput.set($event)" />

    <h2>User Input</h2>
    <pre>{{ userInput() | json }}</pre>
  `,
})
export class App {
  form = form(
    signal<FieldSpec>({
      kind: 'group',
      children: {
        name: {
          kind: 'group',
          children: {
            first: { kind: 'terminal', initial: 'Bob', validation: { required: true } },
            last: {
              kind: 'terminal',
              initial: 'Loblaw',
              validation: { required: false },
            },
          },
        },
        address: {
          kind: 'group',
          children: {
            street: { kind: 'terminal', initial: '', validation: { required: true } },
            city: { kind: 'terminal', initial: '', validation: { required: true } },
            state: { kind: 'terminal', initial: '', validation: { required: true } },
            zip: { kind: 'terminal', initial: '', validation: { required: true } },
          },
        },
        items: {
          kind: 'array',
          initial: [
            { name: 'Apple', quantity: 5 },
            { name: 'Banana', quantity: 2 },
          ],
          template: {
            kind: 'group',
            children: {
              name: {
                kind: 'terminal',
                initial: '',
                validation: { required: true },
              },
              quantity: { kind: 'terminal', initial: 1, validation: { required: true } },
            },
          },
          validation: { minLength: 1, maxLength: 5 },
        },
      },
    }),
  );

  removeForm = form(signal(''));

  addForm = form(signal({ name: '', initial: '', required: false, to: '' }));

  userInput = signal<unknown>(undefined);

  remove() {
    this.form().value.update((current) => remove(current, this.removeForm().value()));
  }

  add() {
    this.form().value.update((current) => add(current, this.addForm().value()));
  }

  shuffle() {
    this.form().value.update((current) => shuffle(current));
  }
}

function remove(spec: FieldSpec, name: string): FieldSpec {
  if (!name) return { kind: 'group', children: {} };
  const path = name.split('.');
  const key = path.pop()!;
  const group = lookupFieldSpec(spec, path);
  assertGroupFieldSpec(group);
  delete group.children[key];
  return { ...spec };
}

function add(spec: FieldSpec, { name, initial, required }: AddInfo): FieldSpec {
  if (!name) return spec;
  const path = name.split('.');
  const key = path.pop()!;
  const group = lookupFieldSpec(spec, path);
  assertGroupFieldSpec(group);
  group.children[key] = { kind: 'terminal', initial, validation: { required } };
  return { ...spec };
}

function shuffle(spec: FieldSpec): FieldSpec {
  if (spec.kind === 'group') {
    return {
      ...spec,
      children: Object.fromEntries(
        shuffleArr(Object.entries(spec.children).map(([k, s]) => [k, shuffle(s)] as const)),
      ),
    };
  }
  if (spec.kind === 'array') {
    return { ...spec, template: shuffle(spec.template) };
  }
  return { ...spec };
}

function shuffleArr<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
