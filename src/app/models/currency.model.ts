import { DateField, MapClass, MapInterface } from "mapper-factory";

@MapClass()
export class Currency {
  id!: string;
  name!: string;
  code!: string;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface Currency extends MapInterface<Currency> { }
