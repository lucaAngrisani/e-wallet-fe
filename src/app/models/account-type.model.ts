import { DateField, MapClass, MapInterface } from "mapper-factory";

@MapClass()
export class AccountType {
  id!: string;
  name!: string;
  description!: string;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface AccountType extends MapInterface<AccountType> { }
