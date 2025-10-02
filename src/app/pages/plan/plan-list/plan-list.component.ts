import { Component, computed, inject } from '@angular/core';
import { PlanService } from '../plan.service';
import { TableComponent } from '../../../templates/table/table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from '@angular/common';
import { ColumnComponent } from '../../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../../templates/table/directives/body-template.directive';
import { CurrencySymbolsService } from '../../../services/currency-symbols.service';
import { ConfirmService } from '../../../components/confirm-dialog/confirm.service';

@Component({
  selector: 'app-plan-list',
  templateUrl: './plan-list.component.html',
  imports: [
    CurrencyPipe,
    MatIconModule,
    TableComponent,
    MatButtonModule,
    TranslateModule,
    ColumnComponent,
    BodyTemplateDirective,
  ],
  providers: [ConfirmService, PlanService],
})
export default class PlanListComponent {
  NEW_PLAN_ROUTE = [ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.PLAN_NEW];

  public planListService = inject(PlanService);
  public router = inject(Router);

  private confirmService = inject(ConfirmService);
  private translate = inject(TranslateService);

  public goToDetail(id: string) {
    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.PLAN_EDIT, id]);
  }

  public async askToDeletePlan(itemId: string) {
    const ok = await this.confirmService.open(
      this.translate.instant('account-list.confirmDelete'),
      {
        title: this.translate.instant('common.attention'),
        confirmText: this.translate.instant('common.yes'),
        cancelText: this.translate.instant('common.no'),
      }
    );

    if (!ok) return;

    this.planListService.deletePlan(itemId);
  }
}
