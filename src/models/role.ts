// src/models/role.ts
import { DataTypes, Model, Optional, HasManyGetAssociationsMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import User from './user';
import RolePermission from './rolePermission';

// --- ATTRIBUTES & INTERFACES ---
export interface RoleAttributes {
    id: string;
    name: string; // Ex: 'Admin', 'Operator', 'Doctor'
    description: string | null;
}

export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description'> {}

// --- CLASS DEFINITION ---
class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    public id!: string;
    public name!: string;
    public description!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getUsers!: HasManyGetAssociationsMixin<User>;
    public getRolePermissions!: HasManyGetAssociationsMixin<RolePermission>;

    // Propriétés de navigation
    public users?: User[];
    public rolePermissions?: RolePermission[];

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Role.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'role_id'
                },
                name: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    unique: true,
                    field: 'role_name'
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: 'description'
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'roles',
                timestamps: true,
                modelName: 'Role',
                underscored: true,
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // One-to-Many vers User (Un rôle peut avoir plusieurs utilisateurs)
        Role.hasMany(models.User, { foreignKey: 'role_id', as: 'users' });

        // Many-to-Many vers Permission (via RolePermission)
        Role.hasMany(models.RolePermission, { foreignKey: 'role_id', as: 'rolePermissions' });
    }
}

export default Role;