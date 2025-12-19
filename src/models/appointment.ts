import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasOneGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import Doctor from './doctor';
import Patient from './patient';
import Exam from './exam';
import Operation from './operation';

export enum AppointmentStatusEnum {
    SCHEDULED = 'SCHEDULED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export interface AppointmentAttributes {
    id: string;
    startTime: Date;
    endTime: Date;
    status: AppointmentStatusEnum;
    doctorId: string;
    patientId: string;
    hospitalId: string;
    operationId: string; // Lien vers l'acte spécifique choisi
    notes: string | null;  // Champ "Say something..."
    bookingNumber: string; // Code unique ex: "VRM112499"
}

export interface AppointmentCreationAttributes extends Optional<AppointmentAttributes, 'id' | 'notes' | 'status'> {}

class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
    public id!: string;
    public startTime!: Date;
    public endTime!: Date;
    public status!: AppointmentStatusEnum;
    public doctorId!: string;
    public patientId!: string;
    public hospitalId!: string;
    public operationId!: string;
    public notes!: string | null;
    public bookingNumber!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getDoctor!: BelongsToGetAssociationMixin<Doctor>;
    public getPatient!: BelongsToGetAssociationMixin<Patient>;
    public getOperation!: BelongsToGetAssociationMixin<Operation>;
    public getExam!: HasOneGetAssociationMixin<Exam>;

    public static initialize(sequelizeInstance: Sequelize) {
        Appointment.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    field: 'appointment_id'
                },
                startTime: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: 'start_time'
                },
                endTime: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: 'end_time'
                },
                status: {
                    type: DataTypes.ENUM(...Object.values(AppointmentStatusEnum)),
                    allowNull: false,
                    defaultValue: AppointmentStatusEnum.SCHEDULED,
                },
                doctorId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'doctor_id',
                    references: { model: 'doctors', key: 'doctor_id' }
                },
                patientId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'patient_id',
                    references: { model: 'patients', key: 'patient_id' }
                },
                hospitalId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'hospital_id',
                    references: { model: 'hospitals', key: 'hospital_id' }
                },
                operationId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'operation_id',
                    references: { model: 'operations', key: 'operation_id' }
                },
                notes: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                bookingNumber: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    unique: true,
                    field: 'booking_number'
                }
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'appointments',
                underscored: true,
                indexes: [
                    { fields: ['doctor_id', 'start_time', 'end_time'], name: 'idx_doctor_time_slot' },
                    { fields: ['booking_number'], unique: true }
                ]
            }
        );
    }

    public static associate(models: AllModels) {
        Appointment.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
        Appointment.belongsTo(models.Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
        Appointment.belongsTo(models.Patient, { foreignKey: 'patient_id', as: 'patient' });
        Appointment.belongsTo(models.Operation, { foreignKey: 'operation_id', as: 'operation' });
        Appointment.hasOne(models.Exam, { foreignKey: 'appointment_id', as: 'exam' });
    }
}

export default Appointment;