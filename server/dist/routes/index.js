"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
// Controllers
const authCtrl = __importStar(require("../controllers/auth.controller"));
const patientCtrl = __importStar(require("../controllers/patient.controller"));
const aptCtrl = __importStar(require("../controllers/appointment.controller"));
const visitCtrl = __importStar(require("../controllers/visit.controller"));
const billCtrl = __importStar(require("../controllers/billing.controller"));
const invCtrl = __importStar(require("../controllers/inventory.controller"));
const treatCtrl = __importStar(require("../controllers/treatment.controller"));
const taskCtrl = __importStar(require("../controllers/task.controller"));
const recallCtrl = __importStar(require("../controllers/recall.controller"));
const setCtrl = __importStar(require("../controllers/setting.controller"));
const reportCtrl = __importStar(require("../controllers/report.controller"));
const router = (0, express_1.Router)();
// ==========================================
// AUTHENTICATION
// ==========================================
router.post('/auth/register', (0, validation_1.validateRequest)(authCtrl.registerSchema), authCtrl.register);
router.post('/auth/login', (0, validation_1.validateRequest)(authCtrl.loginSchema), authCtrl.login);
// ==========================================
// PROTECTED ROUTES (Requires JWT)
// ==========================================
router.use(auth_1.authenticateJWT);
// Patients Management
router.post('/patients', (0, validation_1.validateRequest)(patientCtrl.patientSchema), patientCtrl.createPatient);
router.get('/patients', patientCtrl.getPatients);
router.get('/patients/:id', patientCtrl.getPatientById);
router.put('/patients/:id', patientCtrl.updatePatient);
router.delete('/patients/:id', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER'), patientCtrl.deletePatient);
router.post('/patients/:id/tooth-history', patientCtrl.updateToothStatus);
// Appointments
router.post('/appointments', (0, validation_1.validateRequest)(aptCtrl.appointmentSchema), aptCtrl.createAppointment);
router.get('/appointments', aptCtrl.getAppointments);
router.put('/appointments/:id', aptCtrl.updateAppointment);
router.delete('/appointments/:id', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER', 'DOCTOR'), aptCtrl.deleteAppointment);
// Visits & Prescriptions
router.post('/visits', (0, validation_1.validateRequest)(visitCtrl.visitSchema), visitCtrl.createVisit);
router.get('/visits/patient/:patientId', visitCtrl.getPatientVisits);
router.get('/visits/:id', visitCtrl.getVisitById);
// Billing & Payments
router.post('/invoices', (0, validation_1.validateRequest)(billCtrl.invoiceSchema), billCtrl.createInvoice);
router.get('/invoices', billCtrl.getInvoices);
router.get('/invoices/:id', billCtrl.getInvoiceById);
router.post('/payments', billCtrl.addPayment);
router.get('/billing/daily-summary', billCtrl.getDailySummary);
// Inventory
router.post('/inventory', (0, validation_1.validateRequest)(invCtrl.inventoryItemSchema), invCtrl.createInventoryItem);
router.get('/inventory', invCtrl.getInventoryItems);
router.put('/inventory/:id', invCtrl.updateInventoryItem);
router.delete('/inventory/:id', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER'), invCtrl.deleteInventoryItem);
// Treatments & Treatment Plans
router.post('/treatments', (0, validation_1.validateRequest)(treatCtrl.treatmentSchema), treatCtrl.createTreatment);
router.get('/treatments', treatCtrl.getTreatments);
router.put('/treatments/:id', treatCtrl.updateTreatment);
router.delete('/treatments/:id', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER'), treatCtrl.deleteTreatment);
router.post('/treatment-plans', (0, validation_1.validateRequest)(treatCtrl.treatmentPlanSchema), treatCtrl.createTreatmentPlan);
router.get('/treatment-plans/patient/:patientId', treatCtrl.getPatientTreatmentPlans);
router.put('/treatment-plans/item/:itemId', treatCtrl.updateTreatmentPlanItemStatus);
// Clinical Tasks
router.post('/tasks', (0, validation_1.validateRequest)(taskCtrl.taskSchema), taskCtrl.createTask);
router.get('/tasks', taskCtrl.getTasks);
router.put('/tasks/:id', taskCtrl.updateTask);
router.delete('/tasks/:id', taskCtrl.deleteTask);
// Recalls
router.post('/recalls', (0, validation_1.validateRequest)(recallCtrl.recallSchema), recallCtrl.createRecall);
router.get('/recalls', recallCtrl.getRecalls);
router.put('/recalls/:id', recallCtrl.updateRecall);
router.delete('/recalls/:id', recallCtrl.deleteRecall);
// Clinic Settings & Users
router.get('/settings', setCtrl.getClinicSettings);
router.put('/settings', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER'), (0, validation_1.validateRequest)(setCtrl.clinicUpdateSchema), setCtrl.updateClinicSettings);
router.get('/settings/users', setCtrl.getClinicUsers);
router.post('/settings/users', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER'), (0, validation_1.validateRequest)(setCtrl.userCreateSchema), setCtrl.createClinicUser);
router.put('/settings/users/:id', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER'), setCtrl.updateClinicUser);
router.put('/settings/subscription', (0, auth_1.authorizeRoles)('SUPER_ADMIN', 'OWNER'), setCtrl.updateSubscription);
// Reports & Analytics (PRO subscription tier required)
router.get('/reports', reportCtrl.getReports);
exports.default = router;
