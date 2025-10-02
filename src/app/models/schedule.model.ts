import { DateField, MapClass, MapInterface, ObjectField } from 'mapper-factory';
import { FREQUENCY } from '../enums/frequency.enum';

@MapClass()
export class Schedule {
  byMonth?: number | null;
  byDay?: number | null;
  byDayWeek?: number | null;
  byHour?: number | null;
  byMinute?: number | null;
  freq!: FREQUENCY;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface Schedule extends MapInterface<Schedule> {}
