// src/models/user.ts (MISE À JOUR & CORRIGÉE)
import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasOneGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import Doctor from './doctor';
import Patient from './patient';
import Role from './role'; // <-- NOUVEAU

// --- ATTRIBUTES & INTERFACES ---
export interface UserAttributes {
    id: string;
    email: string;
    password: string; // Hashé
    roleId: string;
    hospitalId: string | null; // ➡️ RENDU NULLABLE
}

// hospitalId ajouté à Optional (permet la création sans cet attribut)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'hospitalId'> {}

// --- CLASS DEFINITION ---
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public email!: string;
    public password!: string;
    public roleId!: string;
    public hospitalId!: string | null; // ➡️ RENDU NULLABLE

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getRole!: BelongsToGetAssociationMixin<Role>;
    public getDoctor!: HasOneGetAssociationMixin<Doctor>;
    public getPatient!: HasOneGetAssociationMixin<Patient>;

    // Propriétés de navigation
    public hospital?: Hospital;
    public role?: Role;
    public doctor?: Doctor;
    public patient?: Patient;

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        User.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'user_id'
                },
                email: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'email'
                },
                password: {
                    type: DataTypes.STRING(255), // Doit être crypté
                    allowNull: false,
                    field: 'password_hash'
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
                    onDelete: 'RESTRICT',
                },
                hospitalId: {
                    type: DataTypes.UUID,
                    allowNull: true, // ➡️ MODIFIÉ : Autoriser NULL
                    field: 'hospital_id',
                    references: {
                        model: 'hospitals',
                        key: 'hospital_id',
                    },
                    onUpdate: 'CASCADE',
                    // onDelete 'RESTRICT' peut rester car si l'hôpital est supprimé, l'utilisateur doit être traité
                    onDelete: 'SET NULL', // ➡️ Recommandation : Mettre à NULL si l'hôpital est supprimé (pour Patient/Personnel, cela pourrait nécessiter une logique métier plus complexe)
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'users',
                timestamps: true,
                modelName: 'User',
                underscored: true,
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One avec Hospital (Ancrage)
        User.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });

        // Many-to-One avec Role (Un utilisateur a un rôle)
        User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });

        // One-to-One conditional
        User.hasOne(models.Doctor, { foreignKey: 'user_id', as: 'doctorProfile' });
        User.hasOne(models.Patient, { foreignKey: 'user_id', as: 'patientProfile' });
    }
}

export default User;