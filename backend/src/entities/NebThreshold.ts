import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'neb_thresholds' })
export class NebThreshold {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int')
  min!: number;

  @Column()
  neb_class!: string;

  @Column()
  equivalent!: string;

  @Column('text')
  meaning!: string;

  @Column('int')
  neb_score!: number;

  @Column('int')
  ordinal!: number;
}
