import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import {
  AfterViewInit,
  Component,
  computed,
  ContentChildren,
  effect,
  inject,
  input,
  InputSignal,
  output,
  QueryList,
  signal,
  Signal,
  TemplateRef,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { TableColumn } from './table-column.type';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgTemplateOutlet } from '@angular/common';
import { ColumnComponent } from './column/column.component';
import { SessionStore } from '../../stores/session.store';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  imports: [
    FormsModule,
    MatSortModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    TranslateModule,
    MatButtonModule,
    NgTemplateOutlet,
    MatFormFieldModule,
    MatPaginatorModule,
  ],
})
export class TableComponent<T> implements AfterViewInit {
  store = inject(SessionStore);
  private breakpointObserver = inject(BreakpointObserver);

  isSmallScreen = toSignal(
    this.breakpointObserver
      .observe('(max-width: 800px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false }
  );

  enableCustomActions: InputSignal<boolean> = input<boolean>(false);

  columns: InputSignal<TableColumn[]> = input<TableColumn[]>([]);
  values: InputSignal<T[]> = input<T[]>([]);

  tableId: InputSignal<string | undefined> = input<string | undefined>();

  addMode: WritableSignal<boolean> = signal<boolean>(false);
  insertColumns: Signal<string[]> = computed(() =>
    this.addMode() && !this.enableCustomActions()
      ? [...this.columns().map((c) => `${c.propName}__ins`), '__actions__ins']
      : []
  );
  insertBuffer: WritableSignal<Partial<T | any>> = signal<Partial<T | any>>({});

  editMode: InputSignal<boolean> = input<boolean>(false);
  editingRowIdList: WritableSignal<string[]> = signal<string[]>([]);
  editElementList: WritableSignal<{ [key: string]: T | any }> = signal<{
    [key: string]: T | any;
  }>({});

  onEditItem = output<T>();
  onDeleteItem = output<string>();

  displayedColumns: Signal<string[]> = computed(() => {
    let columns = this.columns();
    if (this.isSmallScreen()) {
      columns = columns.filter((c) => !c.hideOnMobile);
    }
    const colNames = columns.map((c) => c.propName);
    if (this.editMode() && !this.enableCustomActions())
      colNames.push('__actions');
    return colNames;
  });

  dataSource = new MatTableDataSource<T>([]);

  bodyTemplates: Record<string, TemplateRef<any>> = {};
  @ContentChildren(ColumnComponent) customColumns =
    new QueryList<ColumnComponent>();

  @ViewChild(MatTable) table!: MatTable<T>;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  showPaginator = input(true);
  disableSort = input(false);
  showSort: Signal<boolean> = input(true);

  pageSize: Signal<number> = input(5);
  pageSizeOptions: Signal<number[]> = input([5, 10, 25]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.values() ?? [];
    });
  }

  ngAfterContentInit() {
    const build = () => {
      this.bodyTemplates = {};
      for (const d of this.customColumns) {
        if (d.customBody) {
          this.bodyTemplates[d.name] = d.customBody.template;
        }
      }
    };
    build();
    this.customColumns.changes.subscribe(build);
  }

  ngAfterViewInit() {
    const ds = this.dataSource;
    if (this.showPaginator()) ds.paginator = this.paginator;
    if (this.showSort()) {
      ds.sort = this.sort;

      // Configura l'accessor per il sorting per gestire proprietà annidate
      ds.sortingDataAccessor = (item: any, property: string) => {
        const column = this.columns().find(col => col.propName === property);
        const sortByPath = column?.sortBy || property;

        // Naviga attraverso le proprietà annidate
        const value = sortByPath.split('.').reduce((obj, key) => {
          return obj?.[key];
        }, item);

        // Gestisce valori null/undefined
        return value ?? '';
      };
    }

    // applica stato iniziale e NOTIFICA la datasource
    queueMicrotask(() => {
      const tableId = this.tableId();
      const pag = tableId ? this.store.tablePagination()?.[tableId] : null;
      if (pag) {
        this.paginator.pageSize = pag.pageSize;
        this.paginator.pageIndex = pag.pageIndex;

        this.paginator.page.next(<PageEvent>{
          pageIndex: pag.pageIndex,
          pageSize: pag.pageSize,
          length: this.dataSource.filteredData.length,
        });
      }
    });
  }

  addItem() {
    this.addMode.set(true);
  }

  deleteItem(id: string) {
    this.cancelEdit(id);

    if (id) {
      this.onDeleteItem.emit(id);
    }
  }

  startEdit(id: string) {
    this.editingRowIdList.update((list) => [...list, id]);
    this.editElementList.update((obj) => {
      obj[id] = this.dataSource.data.find(
        (item) => (item as { id: string }).id === id
      );
      return obj;
    });
  }

  saveEdit(id?: string) {
    if (this.addMode() && !id) {
      this.addMode.set(false);
      this.onEditItem.emit(this.insertBuffer() as T);
    } else {
      this.onEditItem.emit(
        this.dataSource.data.find((item) => (item as { id: string }).id === id)!
      );
      this.editElementList.update((obj) => {
        delete obj[id!];
        return obj;
      });
      this.editingRowIdList.update((list) =>
        list.filter((item) => item !== id)
      );
    }
  }

  cancelEdit(id?: string) {
    if (this.addMode() && !id) {
      this.addMode.set(false);
    } else {
      this.editElementList.update((obj) => {
        delete obj[id!];
        return obj;
      });
      this.editingRowIdList.update((list) =>
        list.filter((item) => item !== id)
      );
    }
  }

  onPageChange(event: { pageIndex: number; pageSize: number; length: number }) {
    const tableId = this.tableId();
    if (tableId) {
      this.store.setTablePagination(tableId, event);
    }
  }
}
