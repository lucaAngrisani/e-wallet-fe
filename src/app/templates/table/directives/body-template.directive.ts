import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[bodyTemplate]',
})
export class BodyTemplateDirective {
  constructor(public readonly template: TemplateRef<any>) {}

  @Input('bodyTemplate') bodyTemplate!: string;
}
