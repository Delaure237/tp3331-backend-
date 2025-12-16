import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasOneGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Operation from './operation';
import Appointment from './appointment';
import MedicalReport from './medicalReport';

// --- ATTRIBUTES & INTERFACES ---
export enum ExamStatusEnum {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    REPORTED = 'REPORTED', // Rapport généré
}

export interface ExamAttributes {
    id: string;
    examDate: Date; // Date de l'exécution de l'examen
    status: ExamStatusEnum;
    operationId: string; // Type d'examen (Operation)
    appointmentId: string | null; // RDV qui a déclenché l'examen (Opt.)
}

export interface ExamCreationAttributes extends Optional<ExamAttributes, 'id' | 'appointmentId'> {}

// --- CLASS DEFINITION ---
class Exam extends Model<ExamAttributes, ExamCreationAttributes> implements ExamAttributes {
    public id!: string;
    public examDate!: Date;
    public status!: ExamStatusEnum;
    public operationId!: string;
    public appointmentId!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getOperation!: BelongsToGetAssociationMixin<Operation>;
    public getAppointment!: BelongsToGetAssociationMixin<Appointment>;
    public getMedicalReport!: HasOneGetAssociationMixin<MedicalReport>;

    // Propriétés de navigation
    public operation?: Operation;
    public appointment?: Appointment;
    public medicalReport?: MedicalReport;

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Exam.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'exam_id'
                },
                examDate: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'exam_date'
                },
                status: {
                    type: DataTypes.ENUM(...Object.values(ExamStatusEnum)),
                    allowNull: false,
                    defaultValue: ExamStatusEnum.PENDING,
                    field: 'status'
                },
                operationId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'operation_id',
                    references: {
                        model: 'operations',
                        key: 'operation_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
                appointmentId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    unique: true, // Un RDV ne déclenche qu'un seul enregistrement d'Exam de ce type
                    field: 'appointment_id',
                    references: {
                        model: 'appointments',
                        key: 'appointment_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'exams',
                timestamps: true,
                modelName: 'Exam',
                underscored: true,
                indexes: [
                    { fields: ['operation_id'] },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        Exam.belongsTo(models.Operation, { foreignKey: 'operation_id', as: 'operation' });
        Exam.belongsTo(models.Appointment, { foreignKey: 'appointment_id', as: 'appointment' });
        Exam.hasOne(models.MedicalReport, { foreignKey: 'exam_id', as: 'medicalReport' });
    }
}

export default Exam;