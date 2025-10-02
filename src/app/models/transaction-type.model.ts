import { MapClass, MapInterface } from "mapper-factory";

@MapClass()
export class TransactionType {
  id!: string;
  name!: string;
  color!: string;
  description!: string;

  logicalDelete?: number;
}

export interface TransactionType extends MapInterface<TransactionType> { }
