import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import SessionTicket from './sessionTicket';
import MedicalAct from './medicalAct';

// --- ATTRIBUTES & INTERFACES ---
export interface PaymentAttributes {
    id: string;
    amount: number;
    paymentDate: Date;
    method: string; // Ex: 'Card', 'Cash', 'Mobile Money', 'Insurance'
    transactionRef: string | null; // Référence transactionnelle (ex: numéro de chèque, transaction ID)
    hospitalId: string;
    sessionTicketId: string; 
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'transactionRef' | 'paymentDate'> {}

// --- CLASS DEFINITION ---
class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    public id!: string;
    public amount!: number;
    public paymentDate!: Date;
    public method!: string;
    public transactionRef!: string | null;
    public hospitalId!: string;
    public sessionTicketId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getSessionTicket!: BelongsToGetAssociationMixin<SessionTicket>;
    public getCoveredMedicalActs!: HasManyGetAssociationsMixin<MedicalAct>;

    // Propriétés de navigation
    public hospital?: Hospital;
    public sessionTicket?: SessionTicket;
    public coveredMedicalActs?: MedicalAct[];

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Payment.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'payment_id'
                },
                amount: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    field: 'amount',
                    validate: {
                        min: 0,
                    }
                },
                paymentDate: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'payment_date'
                },
                method: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'payment_method'
                },
                transactionRef: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                    field: 'transaction_ref'
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
                sessionTicketId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'session_ticket_id',
                    references: {
                        model: 'session_tickets',
                        key: 'ticket_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'payments',
                timestamps: true,
                modelName: 'Payment',
                underscored: true,
                indexes: [
                    { fields: ['session_ticket_id'] },
                    { fields: ['hospital_id'] },
                    { fields: ['payment_method'] },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Hospital et SessionTicket
        Payment.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
        Payment.belongsTo(models.SessionTicket, { foreignKey: 'session_ticket_id', as: 'sessionTicket' });

        // One-to-Many vers MedicalAct (Pour l'association inverse : un paiement peut couvrir plusieurs actes)
        // La FK 'payment_id' se trouve dans la table MedicalAct
        Payment.hasMany(models.MedicalAct, { foreignKey: 'payment_id', as: 'coveredMedicalActs' });
    }
}

export default Payment;