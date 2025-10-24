import { Component, input, linkedSignal } from '@angular/core';
import { applyEach, Field, form, required } from '@angular/forms/signals';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

export interface FieldSpec {
  name: string;
  initial: string;
  validation: { required: boolean };
}

@Component({
  selector: 'dynamic-form',
  imports: [Field, MatFormField, MatInput, MatError, MatLabel],
  template: `
    @for (fieldSpec of spec(); track fieldSpec) {
      @let field = form[$index];

      <div>
        <mat-form-field>
          <mat-label>{{ fieldSpec.name }}</mat-label>
          <input matInput [field]="field" />
          @for (error of field().errors(); track $index) {
            <mat-error>{{ error.message ?? error.kind }}</mat-error>
          }
        </mat-form-field>
      </div>
    }
  `,
})
export class DynamicForm {
  spec = input.required<FieldSpec[]>();

  model = linkedSignal<FieldSpec[], string[]>({
    source: this.spec,
    computation: (src, prev) =>
      src.map((it) => {
        // If the value hasn't changed from the initial, update to the new initial,
        // otherwise keep the old value.
        const prevIndex = prev?.source.findIndex((spec) => it.name === spec.name) ?? -1;
        return prevIndex > -1 && prev?.value[prevIndex] !== prev?.source[prevIndex].initial
          ? prev?.value[prevIndex]!
          : it.initial;
      }),
  });

  form = form(this.model, (p) => {
    applyEach(p, (it) => {
      required(it, { when: ({ index }) => !!this.spec()[index()].validation.required });
    });
  });
}
