import { DataTypes, Model, Optional, BelongsToGetAssociationMixin, Sequelize } from 'sequelize';
import { AllModels } from './index';
import Exam from './exam';
import Doctor from './doctor';

// --- ATTRIBUTES & INTERFACES ---
export interface MedicalReportAttributes {
    id: string;
    content: string; // Conclusion / Interprétation textuelle
    signedBy: string; // ID du Docteur qui a signé le rapport
    filePath: string | null; // Référence au fichier PDF/document principal
    images: string[] | null; // Liste des références aux fichiers images (JSON)
    examId: string;
}

export interface MedicalReportCreationAttributes extends Optional<MedicalReportAttributes, 'id' | 'filePath' | 'images'> {}

// --- CLASS DEFINITION ---
class MedicalReport extends Model<MedicalReportAttributes, MedicalReportCreationAttributes> implements MedicalReportAttributes {
    public id!: string;
    public content!: string;
    public signedBy!: string;
    public filePath!: string | null;
    public images!: string[] | null;
    public examId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Mixins d'association
    public getExam!: BelongsToGetAssociationMixin<Exam>;
    public getSigner!: BelongsToGetAssociationMixin<Doctor>; // Alias pour le docteur signataire

    // Propriétés de navigation
    public exam?: Exam;
    public signer?: Doctor;

    // --- Méthode statique pour INITIALISER le modèle ---
    public static initialize(sequelizeInstance: Sequelize) {
        MedicalReport.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                    field: 'report_id'
                },
                content: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    field: 'report_content'
                },
                signedBy: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'signed_by_doctor_id',
                    references: {
                        model: 'doctors',
                        key: 'doctor_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                },
                filePath: {
                    type: DataTypes.STRING(512),
                    allowNull: true,
                    field: 'file_path'
                },
                images: {
                    type: DataTypes.TEXT, // Stocké comme JSON stringifié
                    allowNull: true,
                    field: 'image_paths',
                    get() {
                        // Utilisation du cast pour le Getter
                        const rawValue = this.getDataValue('images') as unknown as string | null;
                        return rawValue ? JSON.parse(rawValue) as string[] : null;
                    },
                    set(value: string[] | string | null) {
                        // ➡️ CORRECTION : Ajout du cast pour le Setter
                        const stringValue = value ? JSON.stringify(value) : null;
                        this.setDataValue('images', stringValue as unknown as string[] | null);
                    }
                },
                examId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    unique: true, // Un rapport pour un seul examen
                    field: 'exam_id',
                    references: {
                        model: 'exams',
                        key: 'exam_id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE', // Si l'examen est supprimé, le rapport est supprimé
                },
            },
            {
                sequelize: sequelizeInstance,
                tableName: 'medical_reports',
                timestamps: true,
                modelName: 'MedicalReport',
                underscored: true,
            }
        );
    }

    // --- Méthode statique pour définir les ASSOCIATIONS ---
    public static associate(models: AllModels) {
        // Many-to-One vers Exam
        MedicalReport.belongsTo(models.Exam, { foreignKey: 'exam_id', as: 'exam' });

        // Many-to-One vers Doctor (signataire)
        MedicalReport.belongsTo(models.Doctor, { foreignKey: 'signed_by_doctor_id', as: 'signer' });
    }
}

export default MedicalReport;