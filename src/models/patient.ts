import { DataTypes, Model, Optional, Sequelize, BelongsToGetAssociationMixin, HasOneGetAssociationMixin, HasManyGetAssociationsMixin } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import MedicalReport from './medicalReport';
import Appointment from './appointment';
import Payment from './payment';
import User from './user';

export interface PatientAttributes {
    patientId: string;
    userId: string | null; // Changé en optionnel
    hospitalId: string | null;
    firstName: string;
    lastName: string;
    idNumber: string;
    sex: 'Male' | 'Female' | 'N/A';
    dateOfBirth: Date | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: 'Active' | 'Non-Active' | 'New Patient';
    type: string | null;
}

interface PatientCreationAttributes extends Optional<PatientAttributes,
    'patientId' | 'userId' | 'hospitalId' | 'type' | 'dateOfBirth' | 'phone' | 'email' | 'address'
> {}

class Patient extends Model<PatientAttributes, PatientCreationAttributes> implements PatientAttributes {
    public patientId!: string;
    public userId!: string | null;
    public hospitalId!: string | null;
    public firstName!: string;
    public lastName!: string;
    public idNumber!: string;
    public sex!: 'Male' | 'Female' | 'N/A';
    public dateOfBirth!: Date | null;
    public phone!: string | null;
    public email!: string | null;
    public address!: string | null;
    public status!: 'Active' | 'Non-Active' | 'New Patient';
    public type!: string | null;

    public static initialize(sequelizeInstance: Sequelize): void {
        Patient.init(
            {
                patientId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, field: 'patient_id' },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: true, // Crucial pour la création manuelle
                    field: 'user_id',
                    references: { model: 'users', key: 'user_id' },
                },
                hospitalId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    field: 'hospital_id',
                    references: { model: 'hospitals', key: 'hospital_id' },
                },
                firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
                lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
                idNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'id_number' },
                sex: { type: DataTypes.ENUM('Male', 'Female', 'N/A'), defaultValue: 'N/A', allowNull: false },
                dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true, field: 'date_of_birth' },
                phone: { type: DataTypes.STRING(20), allowNull: true },
                email: { type: DataTypes.STRING(100), allowNull: true },
                address: { type: DataTypes.TEXT, allowNull: true },
                status: { type: DataTypes.ENUM('Active', 'Non-Active', 'New Patient'), defaultValue: 'New Patient', allowNull: false },
                type: { type: DataTypes.STRING(100), allowNull: true },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'patients',
                timestamps: true,
                underscored: true,
            }
        );
    }

    public static associate(models: AllModels): void {
        Patient.belongsTo(models.User, { foreignKey: 'user_id', as: 'userProfile' });
        Patient.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
        Patient.hasOne(models.MedicalReport!, { foreignKey: 'patient_id', as: 'medicalReport', onDelete: 'CASCADE' });
        Patient.hasMany(models.Appointment, { foreignKey: 'patient_id', as: 'appointments' });
        Patient.hasMany(models.Payment, { foreignKey: 'patient_id', as: 'payments' });
    }
}

export default Patient;