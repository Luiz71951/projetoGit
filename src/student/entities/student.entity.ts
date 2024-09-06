import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Student {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    registrationNumber: string;

    @Column({ type: 'varchar', length: 100 })
    course: string;

    @Column({ type: 'varchar', length: 50 })
    class: string;

    @Column({ type: 'text' })
    fingerprint: string;

    @Column({ type: 'text', })
    obs: string;

    @OneToMany(() => Attendance, (attendance) => attendance.student)
    attendances: Attendance[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
