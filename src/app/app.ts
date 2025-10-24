import { Component, signal } from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import { DynamicForm, type FieldSpec } from '../dynamic-form/dynamic-form';
import { FormBuilder } from '../form-builder/form-builder';

@Component({
  selector: 'app-root',
  imports: [Field, DynamicForm, FormBuilder],
  templateUrl: './app.html',
})
export class App {
  form = form(
    signal<FieldSpec[]>([
      { name: 'First', initial: 'Bob', validation: { required: true } },
      { name: 'Last', initial: 'Loblaw', validation: { required: false } },
    ]),
  );
}
