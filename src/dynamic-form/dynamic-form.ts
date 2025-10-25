import { Component, computed, effect, input, linkedSignal, output } from '@angular/core';
import { Field, form, type FieldTree } from '@angular/forms/signals';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  computeDataModel,
  computeStructuredData,
  isArrayForm,
  type DynamicDataModel,
} from './model';
import { createSchema, LABEL, type FieldSpec } from './spec';

@Component({
  selector: 'dynamic-form-terminal',
  imports: [Field, MatFormField, MatInput, MatError, MatLabel],
  template: `
    <mat-form-field>
      <mat-label>{{ field()().property(LABEL)() }}</mat-label>
      <!-- TODO: Why does input get destroyed every time I type? -->
      <input matInput [field]="field()" />
      @for (error of field()().errors(); track $index) {
        <mat-error>{{ error.message ?? error.kind }}</mat-error>
      }
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class DynamicFormTerminal {
  field = input.required<FieldTree<unknown>>();

  LABEL = LABEL;
}

@Component({
  selector: 'dynamic-form-group',
  imports: [DynamicFormTerminal],
  template: `
    <p>{{ field()().property(LABEL)() }}</p>
    @for (child of field(); track child) {
      @if (child) {
        @if (isArrayForm(child)) {
          <dynamic-form-group [field]="child" />
        } @else {
          <dynamic-form-terminal [field]="child" />
        }
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        border-left: 2px solid black;
        padding-left: 10px;
      }
    `,
  ],
})
export class DynamicFormGroup {
  field = input.required<FieldTree<unknown[]>>();

  LABEL = LABEL;
  isArrayForm = isArrayForm;
}

@Component({
  selector: 'dynamic-form',
  imports: [DynamicFormTerminal, DynamicFormGroup],
  template: `
    @if (isArrayForm(form)) {
      <dynamic-form-group [field]="form" />
    } @else {
      <dynamic-form-terminal [field]="form" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        margin: 10px;
      }
    `,
  ],
})
export class DynamicForm {
  spec = input.required<FieldSpec>();

  valueChange = output<unknown>();

  model = linkedSignal<FieldSpec, DynamicDataModel>({
    source: this.spec,
    computation: computeDataModel,
  });

  form = form<unknown>(this.model, createSchema(this.spec));

  structured = computed(() => computeStructuredData(this.form));

  isArrayForm = isArrayForm;

  constructor() {
    effect(() => {
      this.valueChange.emit(this.structured());
    });
    effect(() => {
      console.log(this.model());
    });
  }
}
