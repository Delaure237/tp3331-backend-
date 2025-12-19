import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { AllModels } from './index';

export interface ServiceAttributes {
    id: string;
    name: string;
    description: string | null;
    price: number;
    hospitalId: string;
}

export interface ServiceCreationAttributes extends Optional<ServiceAttributes, 'id' | 'description'> {}

class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
    public id!: string;
    public name!: string;
    public description!: string | null;
    public price!: number;
    public hospitalId!: string;

    public static initialize(sequelizeInstance: Sequelize) {
        Service.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    field: 'service_id'
                },
                name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                price: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
                hospitalId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'hospital_id',
                    references: { model: 'hospitals', key: 'hospital_id' }
                }
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'services',
                underscored: true,
            }
        );
    }

    public static associate(models: AllModels) {
        Service.belongsTo(models.Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
        Service.hasMany(models.Appointment, { foreignKey: 'service_id', as: 'appointments' });
        Service.hasMany(models.Operation, { foreignKey: 'service_id', as: 'operations' });
    }
}

export default Service;