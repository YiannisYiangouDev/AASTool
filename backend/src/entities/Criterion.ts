import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'criteria' })
export class Criterion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column('text')
  definition!: string;

  @Column('text')
  justification!: string;

  @Column('float')
  value!: number;

  @Column('int')
  disability!: number;

  @Column('int')
  dimension!: number;

  @Column('int', { default: 3 })
  score!: number;

  @Column('simple-json')
  levels!: string[];
}
