import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import { DynamicForm } from '../dynamic-form/dynamic-form';
import { isGroup, type FieldSpec } from '../dynamic-form/spec';

interface AddInfo {
  name: string;
  initial: string;
  required: boolean;
  to: string;
}

@Component({
  selector: 'app-root',
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
    <label>To<input [field]="addForm.to" /></label>
    <button (click)="add()">add</button>

    <h3>Reorder:</h3>
    <!--
      TODO: Tracking doesn't work right. Need to use {value: ''} for terminal so it can get a special tracking symbol
    -->
    <button (click)="shuffle()">shuffle order</button>

    <h2>Form</h2>
    <dynamic-form [spec]="form().value()" (valueChange)="input.set($event)" />

    <h2>Input</h2>
    <pre>{{ input() | json }}</pre>
  `,
})
export class App {
  form = form(
    signal<FieldSpec>({
      name: 'Order',
      children: [
        {
          name: 'Name',
          children: [
            { name: 'First', initial: 'Bob', validation: { required: true } },
            { name: 'Last', initial: 'Loblaw', validation: { required: false } },
          ],
        },
        {
          name: 'Address',
          children: [
            { name: 'Street', initial: '', validation: { required: true } },
            { name: 'City', initial: '', validation: { required: true } },
            { name: 'State', initial: '', validation: { required: true } },
            { name: 'Zip', initial: '', validation: { required: true } },
          ],
        },
      ],
    }),
  );

  removeForm = form(signal(''));

  addForm = form(signal({ name: '', initial: '', required: false, to: '' }));

  input = signal<unknown>(undefined);

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
  if (spec.name === name) {
    return { name: '', children: [] };
  }
  if (isGroup(spec)) {
    return {
      ...spec,
      children: spec.children.filter((it) => it.name !== name).map((it) => remove(it, name)),
    };
  }
  return spec;
}

function add(spec: FieldSpec, info: AddInfo): FieldSpec {
  if (isGroup(spec)) {
    if (spec.name === info.to || info.to === '') {
      return {
        ...spec,
        children: [
          ...spec.children,
          {
            name: info.name,
            initial: info.initial,
            validation: { required: info.required },
          },
        ],
      };
    } else {
      return { ...spec, children: spec.children.map((it) => add(it, info)) };
    }
  }
  return { ...spec };
}

function shuffle(spec: FieldSpec): FieldSpec {
  if (isGroup(spec)) {
    return { ...spec, children: shuffleArr(spec.children.map(shuffle)) };
  }
  return spec;
}

function shuffleArr<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
