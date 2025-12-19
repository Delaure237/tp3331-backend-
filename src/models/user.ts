// src/models/user.ts
import {
    DataTypes,
    Model,
    Optional,
    BelongsToGetAssociationMixin,
    HasOneGetAssociationMixin,
    Sequelize
} from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import Doctor from './doctor';
import Patient from './patient';
import Role from './role';


export interface UserAttributes {
    id: string;
    email: string;
    password: string;
    roleId: string;
    hospitalId: string | null;
    otpCode: string | null;
    otpExpiresAt: Date | null;
    isActive: boolean;            
}

// Champs optionnels lors de la création via User.create()
export interface UserCreationAttributes extends Optional<UserAttributes,
    'id' | 'hospitalId' | 'otpCode' | 'otpExpiresAt' | 'isActive'
> {}

// --- CLASS DEFINITION ---
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public email!: string;
    public password!: string;
    public roleId!: string;
    public hospitalId!: string | null;
    public otpCode!: string | null;
    public otpExpiresAt!: Date | null;
    public isActive!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getRole!: BelongsToGetAssociationMixin<Role>;
    public getDoctor!: HasOneGetAssociationMixin<Doctor>;
    public getPatient!: HasOneGetAssociationMixin<Patient>;

    // Propriétés de navigation (chargées via include)
    public hospital?: Hospital;
    public role?: Role;
    public doctorProfile?: Doctor;
    public patientProfile?: Patient;

    // --- INITIALISATION DU MODÈLE ---
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
                    type: DataTypes.STRING(255),
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
                    allowNull: true,
                    field: 'hospital_id',
                    references: {
                        model: 'hospitals',
                        key: 'hospital_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
                },
                // --- Nouveaux champs OTP & Activation ---
                otpCode: {
                    type: DataTypes.STRING(6),
                    allowNull: true,
                    field: 'otp_code'
                },
                otpExpiresAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: 'otp_expires_at'
                },
                isActive: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                    allowNull: false,
                    field: 'is_active'
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'users',
                timestamps: true,
                modelName: 'User',
                underscored: true, // Gère automatiquement created_at / updated_at
            }
        );
    }

    // --- ASSOCIATIONS ---
    public static associate(models: AllModels) {
        User.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
        User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });

        // Correspondance avec les profils spécifiques
        User.hasOne(models.Doctor, { foreignKey: 'user_id', as: 'doctorProfile' });
        User.hasOne(models.Patient, { foreignKey: 'user_id', as: 'patientProfile' });
    }
}

export default User;