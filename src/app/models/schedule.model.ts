import { MapClass, MapInterface, ObjectField } from "mapper-factory";
import { FREQUENCY } from "../enums/frequency.enum";

@MapClass()
export class Schedule {
  byDay!: number;
  byHour?: number | null;
  byMinute?: number | null;
  freq!: FREQUENCY;

  logicalDelete?: number;
}

export interface Schedule extends MapInterface<Schedule> { }
