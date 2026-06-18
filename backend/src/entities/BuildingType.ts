import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'building_types' })
export class BuildingType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column('simple-json')
  disability_weights!: number[];

  @Column('simple-json')
  dimension_weights!: number[];
}
