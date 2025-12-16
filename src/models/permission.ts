// src/models/permission.ts
import { DataTypes, Model, Optional, HasManyGetAssociationsMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import RolePermission from './rolePermission';

// --- ATTRIBUTES & INTERFACES ---
export interface PermissionAttributes {
    id: string;
    action: string; // Ex: 'create_appointment', 'read_patient_data', 'manage_billing'
    resource: string; // Ex: 'Appointment', 'Patient', 'Billing'
}

export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id'> {}

// --- CLASS DEFINITION ---
class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    public id!: string;
    public action!: string;
    public resource!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getRolePermissions!: HasManyGetAssociationsMixin<RolePermission>;

    // Propriétés de navigation
    public rolePermissions?: RolePermission[];

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Permission.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'permission_id'
                },
                action: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'action_name'
                },
                resource: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    field: 'resource_name'
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'permissions',
                timestamps: true,
                modelName: 'Permission',
                underscored: true,
                indexes: [
                    // Une action unique par ressource
                    { fields: ['action_name', 'resource_name'], unique: true, name: 'idx_unique_permission' },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-Many vers Role (via RolePermission)
        Permission.hasMany(models.RolePermission, { foreignKey: 'permission_id', as: 'rolePermissions' });
    }
}

export default Permission;