import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, HasOneGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import User from './user';
import DoctorSchedule from './doctorSchedule';
import Appointment from './appointment';

// --- ATTRIBUTES & INTERFACES ---
export interface DoctorAttributes {
    id: string;
    lastName: string;
    firstName: string;
    specialty: string;
    hospitalId: string;
    userId: string; // Lien direct vers le compte User
}

export interface DoctorCreationAttributes extends Optional<DoctorAttributes, 'id'> {}

// --- CLASS DEFINITION ---
class Doctor extends Model<DoctorAttributes, DoctorCreationAttributes> implements DoctorAttributes {
    public id!: string;
    public lastName!: string;
    public firstName!: string;
    public specialty!: string;
    public hospitalId!: string;
    public userId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getUser!: BelongsToGetAssociationMixin<User>;
    public getSchedules!: HasManyGetAssociationsMixin<DoctorSchedule>;
    public getAppointments!: HasManyGetAssociationsMixin<Appointment>;

    // Propriétés de navigation
    public hospital?: Hospital;
    public user?: User;
    public schedules?: DoctorSchedule[];
    public appointments?: Appointment[];

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Doctor.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'doctor_id'
                },
                lastName: {
                    type: DataTypes.STRING(150),
                    allowNull: false,
                    field: 'last_name'
                },
                firstName: {
                    type: DataTypes.STRING(150),
                    allowNull: false,
                    field: 'first_name'
                },
                specialty: {
                    type: DataTypes.STRING(150),
                    allowNull: false,
                    field: 'specialty'
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
                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    unique: true, // Un docteur = un profil utilisateur
                    field: 'user_id',
                    references: {
                        model: 'users',
                        key: 'user_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'doctors',
                timestamps: true,
                modelName: 'Doctor',
                underscored: true,
                indexes: [
                    { fields: ['hospital_id', 'last_name', 'first_name'], name: 'idx_doctor_name_hospital' },
                    { fields: ['specialty'] },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Hospital (Ancrage)
        Doctor.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });

        // One-to-One vers User
        Doctor.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

        // One-to-Many vers Planning et Rendez-vous
        Doctor.hasMany(models.DoctorSchedule, { foreignKey: 'doctor_id', as: 'schedules' });
        Doctor.hasMany(models.Appointment, { foreignKey: 'doctor_id', as: 'appointments' });

        // One-to-Many vers Rapports signés (si vous les gérez ici, sinon via MedicalReport.signedBy)
        // Doctor.hasMany(models.MedicalReport, { foreignKey: 'signed_by', as: 'signedReports' });
    }
}

export default Doctor;