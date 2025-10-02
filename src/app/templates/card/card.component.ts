import { Component, input, InputSignal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  imports: [MatCardModule],
})
export class CardComponent {
  title: InputSignal<string> = input('');
  subtitle: InputSignal<string> = input('');
}
