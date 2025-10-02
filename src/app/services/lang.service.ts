import { Injectable } from '@angular/core';
import { LANG } from '../enums/lang.enum';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LangService {
  constructor(private translateSvc: TranslateService) {}

  use(lang: LANG) {
    this.translateSvc.use(lang);
  }
}
