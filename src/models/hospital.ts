import { DataTypes, Model, Optional, HasManyGetAssociationsMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';

// --- ATTRIBUTES & INTERFACES ---
export interface HospitalAttributes {
    id: string;
    hospitalName: string;
    hospitalEmail: string;
    phoneNumber1: string;
    phoneNumber2: string | null;
    address: string;
    openingHours: string;
    services: string[]; // Stocké comme JSON/TEXT dans DB
    hospitalLogo: string | null;
    hospitalImages: string[] | null; // Stocké comme JSON/TEXT/ARRAY dans DB
}

export interface HospitalCreationAttributes extends Optional<HospitalAttributes, 'id' | 'phoneNumber2' | 'hospitalLogo' | 'hospitalImages'> {}

// --- CLASS DEFINITION ---
class Hospital extends Model<HospitalAttributes, HospitalCreationAttributes> implements HospitalAttributes {
    public id!: string;
    public hospitalName!: string;
    public hospitalEmail!: string;
    public phoneNumber1!: string;
    public phoneNumber2!: string | null;
    public address!: string;
    public openingHours!: string;
    public services!: string[];
    public hospitalLogo!: string | null;
    public hospitalImages!: string[] | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association (pour le typage)
    public getUsers!: HasManyGetAssociationsMixin<AllModels['User']>;
    public getPatients!: HasManyGetAssociationsMixin<AllModels['Patient']>;
    // ... autres mixins pour Doctor, SessionTicket, etc.

    // Propriétés de navigation (pour l'accès direct)
    public users?: AllModels['User'][];
    public patients?: AllModels['Patient'][];

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        Hospital.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'hospital_id'
                },
                hospitalName: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    field: 'hospital_name'
                },
                hospitalEmail: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    unique: true,
                    field: 'hospital_email'
                },
                phoneNumber1: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    field: 'phone_number_1'
                },
                phoneNumber2: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    field: 'phone_number_2'
                },
                address: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                openingHours: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    field: 'opening_hours'
                },
                services: {
                    // Type DB pour stocker le tableau sérialisé
                    type: DataTypes.TEXT,
                    allowNull: false,
                    defaultValue: '[]',
                    get() {
                        // Le type stocké par getDataValue est string | null
                        const rawValue = this.getDataValue('services') as unknown as string | null;

                        // Retourne le type défini dans l'interface (string[])
                        return rawValue ? JSON.parse(rawValue) as string[] : [];
                    },
                    set(value: string[] | string) {
                        // Stocke la chaîne JSON (string)
                        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                        // Cast pour satisfaire setDataValue
                        this.setDataValue('services', stringValue as unknown as string[]);
                    }
                },
                hospitalLogo: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                    field: 'hospital_logo_path'
                },
                hospitalImages: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: 'hospital_images_paths',
                    get() {
                         // Le type stocké par getDataValue est string | null
                        const rawValue = this.getDataValue('hospitalImages') as unknown as string | null;

                        // Retourne le type défini dans l'interface (string[] | null)
                        return rawValue ? JSON.parse(rawValue) as string[] : null;
                    },
                    set(value: string[] | string | null) {
                         // Stocke la chaîne JSON (string | null)
                        const stringValue = value ? JSON.stringify(value) : null;
                        // Cast pour satisfaire setDataValue
                        this.setDataValue('hospitalImages', stringValue as unknown as string[] | null);
                    }
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'hospitals',
                timestamps: true,
                modelName: 'Hospital',
                underscored: true,
                indexes: [
                    { fields: ['hospital_email'], unique: true },
                ]
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // One-to-Many Associations (Lien d'ancrage principal)
        Hospital.hasMany(models.User, { foreignKey: 'hospital_id', as: 'users' });
        Hospital.hasMany(models.Patient, { foreignKey: 'hospital_id', as: 'patients' });
        Hospital.hasMany(models.Doctor, { foreignKey: 'hospital_id', as: 'doctors' });
        Hospital.hasMany(models.Service, { foreignKey: 'hospital_id', as: 'servicesProvided' });
        Hospital.hasMany(models.SessionTicket, { foreignKey: 'hospital_id', as: 'tickets' });
        Hospital.hasMany(models.Appointment, { foreignKey: 'hospital_id', as: 'appointments' });
    }
}

export default Hospital;