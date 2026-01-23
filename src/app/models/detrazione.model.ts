import { DateField, MapClass, MapInterface } from "mapper-factory";

@MapClass()
export class Detrazione {
  id!: string;
  name!: string;
  description!: string;
  amount!: number;
  years!: number;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface Detrazione extends MapInterface<Detrazione> { }
