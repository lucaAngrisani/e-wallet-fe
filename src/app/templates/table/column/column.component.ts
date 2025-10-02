import { Component, ContentChild, Input } from '@angular/core';
import { BodyTemplateDirective } from '../directives/body-template.directive';

@Component({
  selector: 'custom-column',
  templateUrl: './column.component.html',
})
export class ColumnComponent {
  @ContentChild(BodyTemplateDirective) customBody!: BodyTemplateDirective;

  @Input() name!: string;
}
