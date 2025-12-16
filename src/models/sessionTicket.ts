import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Patient from './patient';
import Hospital from './hospital';
import Payment from './payment';
import MedicalAct from './medicalAct';

// --- ATTRIBUTES & INTERFACES ---
export enum TicketStatusEnum {
    PENDING = 'PENDING', // En attente de paiement
    PARTIAL = 'PARTIAL', // Paiement partiel reçu
    PAID = 'PAID',       // Totalement payé
    CANCELLED = 'CANCELLED',
}

export interface SessionTicketAttributes {
    id: string;
    totalAmount: number;
    ticketDate: Date;
    status: TicketStatusEnum;
    patientId: string;
    hospitalId: string;
}

export interface SessionTicketCreationAttributes extends Optional<SessionTicketAttributes, 'id' | 'ticketDate'> {}

// --- CLASS DEFINITION ---
class SessionTicket extends Model<SessionTicketAttributes, SessionTicketCreationAttributes> implements SessionTicketAttributes {
    public id!: string;
    public totalAmount!: number;
    public ticketDate!: Date;
    public status!: TicketStatusEnum;
    public patientId!: string;
    public hospitalId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getPatient!: BelongsToGetAssociationMixin<Patient>;
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getPayments!: HasManyGetAssociationsMixin<Payment>;
    public getMedicalActs!: HasManyGetAssociationsMixin<MedicalAct>;

    // Propriétés de navigation
    public patient?: Patient;
    public hospital?: Hospital;
    public payments?: Payment[];
    public medicalActs?: MedicalAct[];

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        SessionTicket.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'ticket_id'
                },
                totalAmount: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    field: 'total_amount',
                    validate: {
                        min: 0,
                    }
                },
                ticketDate: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'ticket_date'
                },
                status: {
                    type: DataTypes.ENUM(...Object.values(TicketStatusEnum)),
                    allowNull: false,
                    defaultValue: TicketStatusEnum.PENDING,
                    field: 'status'
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
                    onDelete: 'RESTRICT',
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
                tableName: 'session_tickets',
                timestamps: true,
                modelName: 'SessionTicket',
                underscored: true,
                indexes: [
                    { fields: ['patient_id', 'ticket_date'] },
                    { fields: ['hospital_id'] },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Patient et Hospital
        SessionTicket.belongsTo(models.Patient, { foreignKey: 'patient_id', as: 'patient' });
        SessionTicket.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });

        // One-to-Many vers Paiements et Actes Médicaux
        // Composition forte : le paiement est une partie du ticket
        SessionTicket.hasMany(models.Payment, { foreignKey: 'session_ticket_id', as: 'payments', onDelete: 'CASCADE' });

        // Composition forte : les actes sont détaillés dans le ticket
        SessionTicket.hasMany(models.MedicalAct, { foreignKey: 'session_id', as: 'medicalActs', onDelete: 'CASCADE' });
    }
}

export default SessionTicket;