import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CardComponent } from '../../templates/card/card.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableComponent } from '../../templates/table/table.component';
import { AccountTypeService } from './services/account-type.service';
import { CurrencyService } from './services/currency.service';
import { CategoryService } from './services/category.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { exportJson } from '../../functions/export-json.function';
import { exportDb, importDb } from '../../../db/logic';
import { importJson } from '../../functions/import-json.function';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { ConfirmService } from '../../components/confirm-dialog/confirm.service';
import { MatDialog } from '@angular/material/dialog';
import { CategoryEditorComponent } from './components/category-editor/category-editor.component';
import { Category } from '../../models/category.model';
import { addCategorySafe } from '../../../db/logic';
import { ColumnComponent } from '../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../templates/table/directives/body-template.directive';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  imports: [
    FormsModule,
    CardComponent,
    MatIconModule,
    TableComponent,
    MatInputModule,
    ColumnComponent,
    TranslateModule,
    MatButtonModule,
    BodyTemplateDirective,
  ],
  providers: [
    ConfirmService,
    CurrencyService,
    CategoryService,
    AccountTypeService,
  ],
})
export default class SettingsComponent {
  @ViewChild('file') file!: ElementRef<HTMLInputElement>;
  private dialog = inject(MatDialog);

  private confirmService = inject(ConfirmService);
  private translate = inject(TranslateService);

  constructor(
    public apiService: ApiService,
    public currencyService: CurrencyService,
    public categoryService: CategoryService,
    public accountTypeService: AccountTypeService
  ) {}

  openCategoryEditor(category?: Category) {
    this.dialog
      .open(CategoryEditorComponent, {
        data: category,
      })
      .afterClosed()
      .subscribe(async (res) => {
        if (res) {
          if (res.id) {
            await this.categoryService.updateCategory(new Category().from(res));
          } else {
            await addCategorySafe(
              new Category().from({ ...res, lastUpdateAt: new Date() })
            );
          }
        }
      });
  }

  async exportJson() {
    const now = new Date().toISOString().slice(0, 19).replace('T', '_');
    exportJson(`db_${now}.json`, await exportDb());
  }

  pickFile() {
    this.file.nativeElement.click();
  }

  async onImport(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      const imported = await importJson<any>(f);
      console.log('IMPORT OK', imported);
      await importDb(imported);
    } catch (e) {
      console.error('JSON non valido', e);
    } finally {
      this.file.nativeElement.value = ''; // reset input
    }
  }

  public async askToDeleteAccountType(itemId: string) {
    const ok = await this.confirmService.open(
      this.translate.instant('settings.account-types.confirmDelete'),
      {
        title: this.translate.instant('common.attention'),
        confirmText: this.translate.instant('common.yes'),
        cancelText: this.translate.instant('common.no'),
      }
    );

    if (!ok) return;

    this.accountTypeService.deleteAccountType(itemId);
  }

  public async askToDeleteCurrency(itemId: string) {
    const ok = await this.confirmService.open(
      this.translate.instant('settings.currencies.confirmDelete'),
      {
        title: this.translate.instant('common.attention'),
        confirmText: this.translate.instant('common.yes'),
        cancelText: this.translate.instant('common.no'),
      }
    );

    if (!ok) return;

    this.currencyService.deleteCurrency(itemId);
  }

  public async askToDeleteCategory(itemId: string) {
    const ok = await this.confirmService.open(
      this.translate.instant('settings.categories.confirmDelete'),
      {
        title: this.translate.instant('common.attention'),
        confirmText: this.translate.instant('common.yes'),
        cancelText: this.translate.instant('common.no'),
      }
    );

    if (!ok) return;

    this.categoryService.deleteCategory(itemId);
  }
}
