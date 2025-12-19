import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Doctor from './doctor';

export enum DayOfWeekEnum {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY',
}

export interface DoctorScheduleAttributes {
    id: string;
    day: DayOfWeekEnum;
    startTime: string;
    endTime: string;
    doctorId: string;
}

export interface DoctorScheduleCreationAttributes extends Optional<DoctorScheduleAttributes, 'id'> {}

class DoctorSchedule extends Model<DoctorScheduleAttributes, DoctorScheduleCreationAttributes> implements DoctorScheduleAttributes {
    public id!: string;
    public day!: DayOfWeekEnum;
    public startTime!: string;
    public endTime!: string;
    public doctorId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public getDoctor!: BelongsToGetAssociationMixin<Doctor>;

    public static initialize(sequelizeInstance: Sequelize) {
        DoctorSchedule.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    field: 'schedule_id'
                },
                day: {
                    type: DataTypes.ENUM(...Object.values(DayOfWeekEnum)),
                    allowNull: false,
                    field: 'day_of_week'
                },
                startTime: {
                    type: DataTypes.TIME,
                    allowNull: false,
                    field: 'start_time'
                },
                endTime: {
                    type: DataTypes.TIME,
                    allowNull: false,
                    field: 'end_time'
                },
                doctorId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'doctor_id',
                    references: { model: 'doctors', key: 'doctor_id' }
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'doctor_schedules',
                underscored: true,
                indexes: [
                    { fields: ['doctor_id', 'day_of_week'], name: 'idx_doctor_schedule_day' }
                ]
            }
        );
    }

    public static associate(models: AllModels) {
        DoctorSchedule.belongsTo(models.Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
    }
}

export default DoctorSchedule;