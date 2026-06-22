import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'disability_types' })
export class DisabilityType {
  @PrimaryColumn('int')
  id!: number;

  @Column()
  name!: string;

  @Column({ default: '❓' })
  icon!: string;

  @Column({ default: '' })
  gradient!: string;

  @Column({ default: '' })
  bg_color!: string;

  @Column({ default: '' })
  text_color!: string;

  @Column({ default: '' })
  border_color!: string;
}
