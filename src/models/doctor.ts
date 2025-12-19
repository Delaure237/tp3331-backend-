import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Hospital from './hospital';
import User from './user';
import DoctorSchedule from './doctorSchedule';
import Appointment from './appointment';

export interface DoctorAttributes {
    id: string;
    lastName: string;
    firstName: string;
    specialty: string;
    phone?: string; // Ajouté : utile pour contacter un externe sans compte User
    email?: string; // Ajouté : utile pour la correspondance hors plateforme
    hospitalId: string;
    userId?: string | null; // Rendu OPTIONNEL pour les intervenants externes
}

export interface DoctorCreationAttributes extends Optional<DoctorAttributes, 'id' | 'userId' | 'phone' | 'email'> {}

class Doctor extends Model<DoctorAttributes, DoctorCreationAttributes> implements DoctorAttributes {
    public id!: string;
    public lastName!: string;
    public firstName!: string;
    public specialty!: string;
    public phone?: string;
    public email?: string;
    public hospitalId!: string;
    public userId?: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins
    public getHospital!: BelongsToGetAssociationMixin<Hospital>;
    public getUser!: BelongsToGetAssociationMixin<User>;
    public getSchedules!: HasManyGetAssociationsMixin<DoctorSchedule>;
    public getAppointments!: HasManyGetAssociationsMixin<Appointment>;

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
                phone: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                },
                email: {
                    type: DataTypes.STRING(150),
                    allowNull: true,
                },
                hospitalId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'hospital_id',
                    references: { model: 'hospitals', key: 'hospital_id' },
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: true, // IMPORTANT : Permet d'avoir des médecins sans compte User
                    unique: true,
                    field: 'user_id',
                    references: { model: 'users', key: 'user_id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL', // Si l'User est supprimé, le profil Doctor reste (archive)
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'doctors',
                timestamps: true,
                modelName: 'Doctor',
                underscored: true,
            }
        );
    }

    public static associate(models: AllModels) {
        Doctor.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
        Doctor.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Doctor.hasMany(models.DoctorSchedule, { foreignKey: 'doctor_id', as: 'schedules' });
        Doctor.hasMany(models.Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
    }
}

export default Doctor;