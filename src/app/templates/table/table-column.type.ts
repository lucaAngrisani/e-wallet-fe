import { TemplateRef } from '@angular/core';

export type TableColumn = {
  label: string;
  propName: string;
  bodyTemplate?: TemplateRef<any>;
};
