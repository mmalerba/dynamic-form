import { Component, model } from '@angular/core';
import { Field, form, type FormValueControl } from '@angular/forms/signals';
import type { FieldSpec } from '../dynamic-form/dynamic-form';
import { FieldSpecBuilder } from './field-spec-builder';

@Component({
  selector: 'form-builder',
  imports: [Field, FieldSpecBuilder],
  template: `
    @for (spec of specsForm; track spec) {
      <div>
        <field-spec-builder [field]="spec" />
        <button (click)="remove($index)">remove</button>
      </div>
    }
    <button (click)="add()">add</button>
  `,
})
export class FormBuilder implements FormValueControl<FieldSpec[]> {
  value = model<FieldSpec[]>(undefined!);
  specsForm = form(this.value);

  remove(idx: number) {
    this.specsForm().value.update((v) => [...v.slice(0, idx), ...v.slice(idx + 1)]);
  }

  add() {
    this.specsForm().value.update((v) => [
      ...v,
      { name: '', initial: '', validation: { required: false } },
    ]);
  }
}
