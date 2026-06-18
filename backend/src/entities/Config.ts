import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'config' })
export class Config {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column('text')
  value!: string;
}
