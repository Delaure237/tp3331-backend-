import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Service from './service';
import MedicalAct from './medicalAct';
import Exam from './exam';

// --- ATTRIBUTES & INTERFACES ---
export interface OperationAttributes {
    id: string;
    name: string;
    price: number; // Prix standard de l'opération
    serviceId: string;
}

export interface OperationCreationAttributes extends Optional<OperationAttributes, 'id'> {}

// --- CLASS DEFINITION ---
class Operation extends Model<OperationAttributes, OperationCreationAttributes> implements OperationAttributes {
    public id!: string;
    public name!: string;
    public price!: number;
    public serviceId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getService!: BelongsToGetAssociationMixin<Service>;
    public getMedicalActs!: HasManyGetAssociationsMixin<MedicalAct>;
    public getExams!: HasManyGetAssociationsMixin<Exam>;

    // Propriétés de navigation
    public service?: Service;
    public medicalActs?: MedicalAct[];
    public exams?: Exam[];

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Operation.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'operation_id'
                },
                name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    field: 'operation_name'
                },
                price: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    field: 'price',
                    validate: {
                        min: 0,
                    }
                },
                serviceId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'service_id',
                    references: {
                        model: 'services',
                        key: 'service_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT', // On ne supprime pas une Operation si des Services la regroupe
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'operations',
                timestamps: true,
                modelName: 'Operation',
                underscored: true,
                indexes: [
                    // S'assurer que le nom de l'opération est unique par service
                    { fields: ['service_id', 'operation_name'], unique: true, name: 'idx_unique_operation_per_service' },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Service
        Operation.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });

        // One-to-Many vers MedicalAct (L'opération définit un acte réel)
        Operation.hasMany(models.MedicalAct, { foreignKey: 'operation_id', as: 'medicalActs' });

        // One-to-Many vers Exam (L'opération définit un type d'examen)
        Operation.hasMany(models.Exam, { foreignKey: 'operation_id', as: 'exams' });
    }
}

export default Operation;