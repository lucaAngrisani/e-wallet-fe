import { DateField, MapClass, MapInterface } from "mapper-factory";

@MapClass()
export class Category {
  id!: string;
  name!: string;
  parentId?: string;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface Category extends MapInterface<Category> { }
