// src/models/index.ts

import { sequelize } from '../../config/database';

// Importez Model et Sequelize depuis sequelize.
import { Model, ModelStatic, Sequelize } from 'sequelize';


import Hospital from './hospital';
import User from './user';
import Patient from './patient';
import Doctor from './doctor';

// FACTURATION ET PAIEMENT
import SessionTicket from './sessionTicket';
import Payment from './payment';
import MedicalAct from './medicalAct';

// SERVICES ET ACTES
import Service from './service';
import Operation from './operation';

// PLANNING ET EXAMENS
import DoctorSchedule from './doctorSchedule';
import Appointment from './appointment';
import Exam from './exam';
import MedicalReport from './medicalReport';

// ➡️ NOUVEAUX MODÈLES RBAC
import Role from './role';
import Permission from './permission';
import RolePermission from './rolePermission';

// --- 2. Définition de l'interface pour les méthodes STATIQUES ---
export interface CustomModelStatic {
    initialize: (sequelize: Sequelize) => void;
    associate: (models: AllModels) => void;
}

// --- 3. Type utilitaire pour les modèles ---
export type ModelWithCustomStatic<T extends Model> = ModelStatic<T> & CustomModelStatic;

// --- 4. Définition de l'interface 'AllModels' (Type Map) ---
export interface AllModels {
    [key: string]: ModelStatic<Model> & CustomModelStatic;

    Hospital: ModelStatic<Hospital> & CustomModelStatic;
    User: ModelStatic<User> & CustomModelStatic;
    Patient: ModelStatic<Patient> & CustomModelStatic;
    Doctor: ModelStatic<Doctor> & CustomModelStatic;
    SessionTicket: ModelStatic<SessionTicket> & CustomModelStatic;
    Payment: ModelStatic<Payment> & CustomModelStatic;
    MedicalAct: ModelStatic<MedicalAct> & CustomModelStatic;
    Service: ModelStatic<Service> & CustomModelStatic;
    Operation: ModelStatic<Operation> & CustomModelStatic;
    DoctorSchedule: ModelStatic<DoctorSchedule> & CustomModelStatic;
    Appointment: ModelStatic<Appointment> & CustomModelStatic;
    Exam: ModelStatic<Exam> & CustomModelStatic;
    MedicalReport: ModelStatic<MedicalReport> & CustomModelStatic;

    // ➡️ AJOUTS RBAC
    Role: ModelStatic<Role> & CustomModelStatic;
    Permission: ModelStatic<Permission> & CustomModelStatic;
    RolePermission: ModelStatic<RolePermission> & CustomModelStatic;
}

// --- 5. Création de l'objet 'models' qui contient toutes les classes de modèles ---
const models = {
    Hospital: Hospital,
    User: User,
    Patient: Patient,
    Doctor: Doctor,
    SessionTicket: SessionTicket,
    Payment: Payment,
    MedicalAct: MedicalAct,
    Service: Service,
    Operation: Operation,
    DoctorSchedule: DoctorSchedule,
    Appointment: Appointment,
    Exam: Exam,
    MedicalReport: MedicalReport,

    // ➡️ AJOUTS RBAC
    Role: Role,
    Permission: Permission,
    RolePermission: RolePermission,
} as AllModels;

// --- 6. Fonction pour initialiser TOUS les modèles ---
export const initializeModels = (sequelizeInstance: Sequelize): void => {
    Object.keys(models).forEach(modelName => {
        // ➡️ CORRECTION 3 : Utiliser l'opérateur de non-nullité (!) pour satisfaire le mode strict
        const modelClass = models[modelName as keyof AllModels]!;
        modelClass.initialize(sequelizeInstance);
    });
};

// --- 7. Fonction pour exécuter les associations pour tous les modèles ---
export const associateModels = (allModels: AllModels): void => {
    Object.keys(allModels).forEach(modelName => {
        // ➡️ CORRECTION 3 : Utiliser l'opérateur de non-nullité (!) pour satisfaire le mode strict
        const modelClass = allModels[modelName as keyof AllModels]!;
        modelClass.associate(allModels);
    });
};

// --- 8. INITIALISATION ET ASSOCIATION IMMÉDIATES DES MODÈLES ---
// 🛑 IMPORTANT : COMMENTEZ CES LIGNES DANS LE FICHIER INDEX.TS
// ➡️ CORRECTION 4 : Commenter ET corriger la faute de frappe
// initializeModels(sequelize);
// associateModels(models);

// --- 9. Exportation ---
export { sequelize, models };