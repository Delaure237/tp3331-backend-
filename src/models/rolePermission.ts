// src/models/rolePermission.ts
import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Role from './role';
import Permission from './permission';

// --- ATTRIBUTES & INTERFACES ---
export interface RolePermissionAttributes {
    id: string;
    roleId: string;
    permissionId: string;
}

export interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'id'> {}

// --- CLASS DEFINITION ---
class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
    public id!: string;
    public roleId!: string;
    public permissionId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getRole!: BelongsToGetAssociationMixin<Role>;
    public getPermission!: BelongsToGetAssociationMixin<Permission>;

    // Propriétés de navigation
    public role?: Role;
    public permission?: Permission;

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        RolePermission.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'role_permission_id'
                },
                roleId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'role_id',
                    references: {
                        model: 'roles',
                        key: 'role_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                permissionId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'permission_id',
                    references: {
                        model: 'permissions',
                        key: 'permission_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'role_permissions',
                timestamps: true,
                modelName: 'RolePermission',
                underscored: true,
                indexes: [
                    // Clé unique pour éviter la duplication des liens
                    { fields: ['role_id', 'permission_id'], unique: true, name: 'idx_unique_role_permission' },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Role et Permission
        RolePermission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
        RolePermission.belongsTo(models.Permission, { foreignKey: 'permission_id', as: 'permission' });
    }
}

export default RolePermission;