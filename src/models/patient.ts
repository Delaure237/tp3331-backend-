// src/models/patient.ts (CORRIGÉ)
import { DataTypes, Model, Optional, Sequelize, BelongsToGetAssociationMixin, HasOneGetAssociationMixin, HasManyGetAssociationsMixin } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import MedicalReport from './medicalReport';
import Appointment from './appointment';
import Payment from './payment';
// Import de User (nécessaire pour la relation One-to-One)
import User from './user';

// --- Interfaces pour les Attributs du Modèle ---
export interface PatientAttributes {
    patientId: string;
    userId: string; // ➡️ Ajout de la FK vers User pour la relation One-to-One
    hospitalId: string | null; // ➡️ RENDU NULLABLE
    firstName: string;
    lastName: string;
    idNumber: string;
    status: 'Active' | 'Non-Active' | 'New Patient';
    insurance: string;
    type: string | null; // Rendu nullable

    // Relations optionnelles pour le typage
    hospital?: Hospital;
    userProfile?: User; // Nouveau pour la relation One-to-One
    medicalReport?: MedicalReport;
    appointments?: Appointment[];
    payments?: Payment[];
}

// hospitalId ajouté à Optional
interface PatientCreationAttributes extends Optional<PatientAttributes, 'patientId' | 'type' | 'hospitalId'> {}

// --- Définition de la Classe du Modèle Patient ---
class Patient extends Model<PatientAttributes, PatientCreationAttributes> implements PatientAttributes {
    public patientId!: string;
    public userId!: string; // ➡️ Ajout
    public hospitalId!: string | null; // ➡️ RENDU NULLABLE
    public firstName!: string;
    public lastName!: string;
    public idNumber!: string;
    public status!: 'Active' | 'Non-Active' | 'New Patient';
    public insurance!: string;
    public type!: string | null; // Rendu nullable

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public getUserProfile!: BelongsToGetAssociationMixin<User>; // ➡️ Nouveau
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getMedicalReport!: HasOneGetAssociationMixin<MedicalReport>;
    public getAppointments!: HasManyGetAssociationsMixin<Appointment>;
    public getPayments!: HasManyGetAssociationsMixin<Payment>;

    public static initialize(sequelizeInstance: Sequelize): void {
        Patient.init(
            {
                patientId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, field: 'patient_id' },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    unique: true, // One-to-One
                    field: 'user_id',
                    references: { model: 'users', key: 'user_id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE', // Si l'utilisateur est supprimé, le profil patient aussi
                },
                hospitalId: {
                    type: DataTypes.UUID,
                    allowNull: true, // ➡️ MODIFIÉ : Autoriser NULL
                    field: 'hospital_id',
                    references: { model: 'hospitals', key: 'hospital_id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
                },
                firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
                lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
                idNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'id_number' },
                status: { type: DataTypes.ENUM('Active', 'Non-Active', 'New Patient'), allowNull: false },
                insurance: { type: DataTypes.STRING(100), allowNull: false },
                type: {
                    type: DataTypes.STRING(100),
                    allowNull: true
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'patients',
                timestamps: true,
                modelName: 'Patient',
                underscored: true,
            }
        );
    }

    public static associate(models: AllModels): void {
        // Relation One-to-One vers User
        Patient.belongsTo(models.User, { foreignKey: 'user_id', as: 'userProfile' });

        // Relation Many-to-One vers Hospital
        Patient.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });

        // Autres relations
        Patient.hasOne(models.MedicalReport!, { foreignKey: 'patient_id', as: 'medicalReport', onDelete: 'CASCADE' });
        Patient.hasMany(models.Appointment, { foreignKey: 'patient_id', as: 'appointments' });
        Patient.hasMany(models.Payment, { foreignKey: 'patient_id', as: 'payments' });
    }
}

export default Patient;