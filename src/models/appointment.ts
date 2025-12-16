import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasOneGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import Doctor from './doctor';
import Patient from './patient';
import Exam from './exam';

// --- ATTRIBUTES & INTERFACES ---
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
}

export interface AppointmentCreationAttributes extends Optional<AppointmentAttributes, 'id'> {}

// --- CLASS DEFINITION ---
class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
    public id!: string;
    public startTime!: Date;
    public endTime!: Date;
    public status!: AppointmentStatusEnum;
    public doctorId!: string;
    public patientId!: string;
    public hospitalId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getDoctor!: BelongsToGetAssociationMixin<Doctor>;
    public getPatient!: BelongsToGetAssociationMixin<Patient>;
    public getExam!: HasOneGetAssociationMixin<Exam>;

    // Propriétés de navigation
    public hospital?: Hospital;
    public doctor?: Doctor;
    public patient?: Patient;
    public exam?: Exam;

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Appointment.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
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
                    field: 'status'
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
                    onDelete: 'RESTRICT', // On garde l'historique du RDV même si le doc part
                },
                patientId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'patient_id',
                    references: {
                        model: 'patients',
                        key: 'patient_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT', // On garde l'historique du RDV même si le patient part (gestion des archives)
                },
                hospitalId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'hospital_id',
                    references: {
                        model: 'hospitals',
                        key: 'hospital_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'appointments',
                timestamps: true,
                modelName: 'Appointment',
                underscored: true,
                indexes: [
                    // Index pour éviter les chevauchements basiques (doit être vérifié par logique métier aussi)
                    { fields: ['doctor_id', 'start_time', 'end_time'], name: 'idx_doctor_time_slot' },
                    { fields: ['patient_id', 'start_time'] },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Hospital, Doctor, Patient
        Appointment.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
        Appointment.belongsTo(models.Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
        Appointment.belongsTo(models.Patient, { foreignKey: 'patient_id', as: 'patient' });

        // One-to-One vers Exam (Un RDV peut entraîner un examen)
        Appointment.hasOne(models.Exam, { foreignKey: 'appointment_id', as: 'exam' });
    }
}

export default Appointment;