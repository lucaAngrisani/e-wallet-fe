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

@Injectable()
export class CategoryService {
  private translate = inject(TranslateService);

  allCategories: Signal<Category[]> = toSignal(
    from(
      liveQuery(() =>
        db.categories
          .where('logicalDelete')
          .notEqual(1)
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
    {
      label: this.translate.instant('category.parent'),
      propName: 'parent',
    },
  ]);

  async deleteCategory(id: string) {
    await db.categories.update(id, { logicalDelete: 1 });
  }

  async updateCategory(updated: Category) {
    if (updated.id) {
      await db.categories.update(updated.id, updated.toMap());
    } else {
      await addCategorySafe(new Category().toModel(updated));
    }
  }
}
