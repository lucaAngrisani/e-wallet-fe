import { DateField, MapClass, MapInterface } from "mapper-factory";

export class AnnualDetrazioneItem {
  detrazioneId!: string;
  franchigia?: number;
  massimale?: number;
}

@MapClass()
export class AnnualDetrazione {
  id!: string;
  year!: number;
  detrazioni: AnnualDetrazioneItem[] = [];
  massimoDetraibile!: number;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface AnnualDetrazione extends MapInterface<AnnualDetrazione> { }
