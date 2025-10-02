import { MapClass, MapInterface } from "mapper-factory";

@MapClass()
export class AccountType {
  id!: string;
  name!: string;
  description!: string;

  logicalDelete?: number;
}

export interface AccountType extends MapInterface<AccountType> { }
