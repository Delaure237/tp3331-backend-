import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Operation from './operation';
import SessionTicket from './sessionTicket';
import Payment from './payment'; // Pour le lien inverse (Payment couvre cet acte)

// --- ATTRIBUTES & INTERFACES ---
export interface MedicalActAttributes {
    id: string;
    date: Date;
    cost: number; // Coût réel appliqué (peut différer du prix de l'Operation si réduction/ajustement)
    operationId: string;
    sessionId: string; // Lien vers le SessionTicket auquel cet acte est rattaché
    paymentId: string | null; // Lien vers le Payment qui couvre cet acte (Opt.)
}

export interface MedicalActCreationAttributes extends Optional<MedicalActAttributes, 'id' | 'paymentId'> {}

// --- CLASS DEFINITION ---
class MedicalAct extends Model<MedicalActAttributes, MedicalActCreationAttributes> implements MedicalActAttributes {
    public id!: string;
    public date!: Date;
    public cost!: number;
    public operationId!: string;
    public sessionId!: string;
    public paymentId!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getOperation!: BelongsToGetAssociationMixin<Operation>;
    public getSessionTicket!: BelongsToGetAssociationMixin<SessionTicket>;
    public getPayment!: BelongsToGetAssociationMixin<Payment>;

    // Propriétés de navigation
    public operation?: Operation;
    public sessionTicket?: SessionTicket;
    public payment?: Payment;

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        MedicalAct.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'medical_act_id'
                },
                date: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'act_date'
                },
                cost: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    field: 'cost',
                    validate: {
                        min: 0,
                    }
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
                sessionId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'session_id',
                    references: {
                        model: 'session_tickets',
                        key: 'ticket_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE', // Si le ticket est supprimé, l'acte facturé disparaît avec lui (sauf si archivage obligatoire)
                },
                paymentId: {
                    type: DataTypes.UUID,
                    allowNull: true, // Peut être null si l'acte n'est pas encore couvert par un paiement
                    field: 'payment_id',
                    references: {
                        model: 'payments',
                        key: 'payment_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL', // Si le paiement est annulé ou supprimé, l'acte reste, mais le lien est perdu
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'medical_acts',
                timestamps: true,
                modelName: 'MedicalAct',
                underscored: true,
                indexes: [
                    { fields: ['operation_id', 'act_date'] },
                    { fields: ['session_id'] },
                    { fields: ['payment_id'] },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One
        MedicalAct.belongsTo(models.Operation, { foreignKey: 'operation_id', as: 'operation' });
        MedicalAct.belongsTo(models.SessionTicket, { foreignKey: 'session_id', as: 'sessionTicket' });
        MedicalAct.belongsTo(models.Payment, { foreignKey: 'payment_id', as: 'payment' });
    }
}

export default MedicalAct;