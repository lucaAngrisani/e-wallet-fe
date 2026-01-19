import {
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Category } from '../../../models/category.model';
import { TableColumn } from '../../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { addCategorySafe } from '../../../../db/logic';
import { db } from '../../../../db';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { ToastService } from '../../../services/toast.service';

@Injectable()
export class CategoryService {
  private translate = inject(TranslateService);
  private toastSvc = inject(ToastService);

  allCategories: Signal<Category[]> = toSignal(
    from(
      liveQuery(() =>
        db.categories
          .orderBy('name')
          .filter((tx) => tx.logicalDelete != 1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new Category().from(item));
          })
      )
    ),
    { initialValue: [] as Category[] }
  );

  columns: WritableSignal<TableColumn[]> = signal([
    { label: this.translate.instant('category.name'), propName: 'name' },
    { label: this.translate.instant('common.icon'), propName: 'icon' },
    { label: this.translate.instant('common.color'), propName: 'color' },
    { label: '', propName: 'actions' },
  ]);

  async deleteCategory(id: string) {
    await db.categories.update(id, { logicalDelete: 1, lastUpdateAt: new Date().toISOString() }).then(() => {
      this.toastSvc.success(this.translate.instant('toast.category-deleted'));
    });
  }

  async updateCategory(updated: Category) {
    if (updated.id) {
      await db.categories.update(updated.id, updated.toMap()).then(() => {
        this.toastSvc.info(this.translate.instant('toast.category-updated'));
      });
    } else {
      await addCategorySafe(new Category().toModel(updated)).then(() => {
        this.toastSvc.success(this.translate.instant('toast.category-created'));
      });
    }
  }
}
