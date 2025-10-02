import { MapClass, MapInterface } from "mapper-factory";

@MapClass()
export class Currency {
  id!: string;
  name!: string;
  code!: string;
  symbol!: string;
  description!: string;

  logicalDelete?: number;
}

export interface Currency extends MapInterface<Currency> { }
