import { Component, model } from '@angular/core';
import { Field, form, type FormValueControl } from '@angular/forms/signals';
import type { FieldSpec } from '../dynamic-form/dynamic-form';

@Component({
  selector: 'field-spec-builder',
  imports: [Field],
  template: `
    <input placeholder="name" [field]="specForm.name" />
    <input placeholder="initial" [field]="specForm.initial" />
    <input type="checkbox" [field]="specForm.validation.required" />required?
  `,
})
export class FieldSpecBuilder implements FormValueControl<FieldSpec> {
  value = model<FieldSpec>(undefined!);
  specForm = form(this.value);
}
