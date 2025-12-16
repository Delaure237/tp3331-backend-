import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Doctor from './doctor';

// --- ATTRIBUTES & INTERFACES ---
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
    startTime: string; // Heure (ex: "08:00:00")
    endTime: string;   // Heure (ex: "17:00:00")
    doctorId: string;
}

export interface DoctorScheduleCreationAttributes extends Optional<DoctorScheduleAttributes, 'id'> {}

// --- CLASS DEFINITION ---
class DoctorSchedule extends Model<DoctorScheduleAttributes, DoctorScheduleCreationAttributes> implements DoctorScheduleAttributes {
    public id!: string;
    public day!: DayOfWeekEnum;
    public startTime!: string;
    public endTime!: string;
    public doctorId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getDoctor!: BelongsToGetAssociationMixin<Doctor>;

    // Propriétés de navigation
    public doctor?: Doctor;

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        DoctorSchedule.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
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
                    references: {
                        model: 'doctors',
                        key: 'doctor_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE', // Si le docteur est supprimé, son planning disparaît
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'doctor_schedules',
                timestamps: true,
                modelName: 'DoctorSchedule',
                underscored: true,
                indexes: [
                    {
                        // Un docteur ne devrait pas avoir deux fois le même jour de planning s'ils sont uniques.
                        // Mais ici, on autorise plusieurs entrées par jour (ex: 8h-12h et 14h-18h)
                        fields: ['doctor_id', 'day_of_week'],
                        name: 'idx_doctor_schedule_day'
                    },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Doctor
        DoctorSchedule.belongsTo(models.Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
    }
}

export default DoctorSchedule;