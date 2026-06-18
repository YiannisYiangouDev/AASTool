import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'evaluations' })
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  user_id?: string;

  @Column()
  building_type!: string;

  @Column('simple-json')
  scores!: Record<string, number>;

  @Column('simple-json')
  result!: any;

  @CreateDateColumn()
  created_at!: Date;
  
  @Column('double', { nullable: true })
  obs?: number;

  @Column({ name: 'neb_class', nullable: true })
  neb_class?: string;

  @Column('double', { nullable: true })
  average_raw_score?: number;
}
