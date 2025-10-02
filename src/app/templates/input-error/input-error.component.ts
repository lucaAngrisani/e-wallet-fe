import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-input-error',
  templateUrl: './input-error.component.html',
  imports: [MatFormFieldModule],
})
export class InputErrorComponent {
  control: InputSignal<FormControl> = input(new FormControl());

  error: Signal<string | null> = computed(() => {
    const control = this.control();
    if (control) {
      if (control.touched && control.errors) {
        if (control.errors['required']) {
          return 'This field is required';
        }
        if (control.errors['minlength']) {
          const requiredLength = control.errors['minlength']['requiredLength'];
          return `Minimum length is ${requiredLength}`;
        }
        if (control.errors['maxlength']) {
          const requiredLength = control.errors['maxlength']['requiredLength'];
          return `Maximum length is ${requiredLength}`;
        }
        // Aggiungi altri tipi di errori se necessario
        return 'Invalid field';
      }
    }
    return null;
  });
}
