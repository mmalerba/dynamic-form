import {
  Component,
  computed,
  effect,
  forwardRef,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { Field, form, type FieldTree } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  computeDataModel,
  type DynamicModel,
  type DynamicModelArray,
  type DynamicModelGroup,
} from './model';
import { ARRAY_ITEM_TEMPLATE, createSchema, LABEL, SPEC_KIND } from './schema';
import type { FieldSpec } from './spec';

@Component({
  selector: 'dynamic-form-terminal',
  standalone: true,
  imports: [Field, MatFormField, MatInput, MatError, MatLabel],
  template: `
    <mat-form-field>
      <mat-label>{{ label() }}</mat-label>
      <!-- TODO: separate terminal inputs for different model types -->
      <input matInput [field]="$any(field())" />
      @for (error of errors(); track $index) {
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
  field = input.required<FieldTree<DynamicModel>>();

  label = computed(() => this.field()().metadata(LABEL)());

  errors = computed(() => this.field()().errors());
}

@Component({
  selector: 'dynamic-form-group',
  standalone: true,
  imports: [DynamicFormTerminal, forwardRef(() => DynamicFormArray)],
  template: `
    <p>{{ label() }}</p>
    @for (entry of field(); track entry[0]) {
      @let child = entry[1];
      @if (isObjectFieldTree(child)) {
        <dynamic-form-group [field]="child" />
      } @else if (isArrayFieldTree(child)) {
        <dynamic-form-array [field]="child" />
      } @else {
        <dynamic-form-terminal [field]="child" />
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
  field = input.required<FieldTree<DynamicModelGroup>>();

  label = computed(() => this.field()().metadata(LABEL)());

  isObjectFieldTree = isGroupFieldTree;
  isArrayFieldTree = isArrayFieldTree;
}

@Component({
  selector: 'dynamic-form-array',
  standalone: true,
  imports: [DynamicFormTerminal, DynamicFormGroup, MatButton],
  template: `
    <p>{{ label() }}</p>
    @if (canAdd()) {
      <button matButton (click)="add()">Add</button>
    }
    @for (item of field(); track item) {
      @if (isObjectFieldTree(item)) {
        <dynamic-form-group [field]="item" />
      } @else if (isArrayFieldTree(item)) {
        <dynamic-form-array [field]="item" />
      } @else {
        <dynamic-form-terminal [field]="item" />
      }
      @if (canRemove()) {
        <div class="close"><button matButton (click)="remove($index)">Remove</button></div>
      }
    }
  `,
  styles: [
    `
      :host,
      .close {
        display: block;
        border-left: 2px solid black;
        padding-left: 10px;
      }
    `,
  ],
})
export class DynamicFormArray {
  field = input.required<FieldTree<DynamicModelArray>>();

  state = computed(() => this.field()());

  label = computed(() => this.state().metadata(LABEL)());

  addTemplate = computed(() => this.state().metadata(ARRAY_ITEM_TEMPLATE)());

  canAdd = computed(() => this.state().value().length < (this.state().maxLength?.() ?? Infinity));

  canRemove = computed(() => this.state().value().length > (this.state().minLength?.() ?? -1));

  add() {
    this.state().value.update((prev) => [this.addTemplate()!, ...prev]);
  }

  remove(idx: number) {
    console.log('remove', idx);
    this.state().value.update((prev) => prev.filter((_, i) => i !== idx));
  }

  isObjectFieldTree = isGroupFieldTree;
  isArrayFieldTree = isArrayFieldTree;
}

@Component({
  selector: 'dynamic-form',
  standalone: true,
  imports: [DynamicFormTerminal, DynamicFormGroup, DynamicFormArray],
  template: `
    @if (isObjectFieldTree(form)) {
      <dynamic-form-group [field]="form" />
    } @else if (isArrayFieldTree(form)) {
      <dynamic-form-array [field]="form" />
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

  model = linkedSignal<FieldSpec, DynamicModel>({
    source: this.spec,
    computation: computeDataModel,
  });

  form = form(this.model, createSchema(this.spec));

  constructor() {
    effect(() => {
      this.valueChange.emit(this.form().value());
    });
  }

  isObjectFieldTree = isGroupFieldTree;
  isArrayFieldTree = isArrayFieldTree;
}

function isGroupFieldTree<T>(f: FieldTree<DynamicModel>): f is FieldTree<DynamicModelGroup> {
  return f().metadata(SPEC_KIND)() === 'group';
}

function isArrayFieldTree<T>(f: FieldTree<DynamicModel>): f is FieldTree<DynamicModelArray> {
  return f().metadata(SPEC_KIND)() === 'array';
}
