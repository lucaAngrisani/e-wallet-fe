import { TemplateRef } from '@angular/core';

export type TableColumn = {
  label: string;
  propName: string;
  sortBy?: string;
  bodyTemplate?: TemplateRef<any>;
};
