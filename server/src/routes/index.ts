import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';

// Controllers
import * as authCtrl from '../controllers/auth.controller';
import * as patientCtrl from '../controllers/patient.controller';
import * as aptCtrl from '../controllers/appointment.controller';
import * as visitCtrl from '../controllers/visit.controller';
import * as billCtrl from '../controllers/billing.controller';
import * as invCtrl from '../controllers/inventory.controller';
import * as treatCtrl from '../controllers/treatment.controller';
import * as taskCtrl from '../controllers/task.controller';
import * as recallCtrl from '../controllers/recall.controller';
import * as setCtrl from '../controllers/setting.controller';
import * as reportCtrl from '../controllers/report.controller';

const router = Router();

// ==========================================
// AUTHENTICATION
// ==========================================
router.post('/auth/register', validateRequest(authCtrl.registerSchema), authCtrl.register);
router.post('/auth/login', validateRequest(authCtrl.loginSchema), authCtrl.login);

// ==========================================
// PROTECTED ROUTES (Requires JWT)
// ==========================================
router.use(authenticateJWT);

// Patients Management
router.post('/patients', validateRequest(patientCtrl.patientSchema), patientCtrl.createPatient);
router.get('/patients', patientCtrl.getPatients);
router.get('/patients/:id', patientCtrl.getPatientById);
router.put('/patients/:id', patientCtrl.updatePatient);
router.delete('/patients/:id', authorizeRoles('SUPER_ADMIN', 'OWNER'), patientCtrl.deletePatient);
router.post('/patients/:id/tooth-history', patientCtrl.updateToothStatus);

// Appointments
router.post('/appointments', validateRequest(aptCtrl.appointmentSchema), aptCtrl.createAppointment);
router.get('/appointments', aptCtrl.getAppointments);
router.put('/appointments/:id', aptCtrl.updateAppointment);
router.delete('/appointments/:id', authorizeRoles('SUPER_ADMIN', 'OWNER', 'DOCTOR'), aptCtrl.deleteAppointment);

// Visits & Prescriptions
router.post('/visits', validateRequest(visitCtrl.visitSchema), visitCtrl.createVisit);
router.get('/visits/patient/:patientId', visitCtrl.getPatientVisits);
router.get('/visits/:id', visitCtrl.getVisitById);

// Billing & Payments
router.post('/invoices', validateRequest(billCtrl.invoiceSchema), billCtrl.createInvoice);
router.get('/invoices', billCtrl.getInvoices);
router.get('/invoices/:id', billCtrl.getInvoiceById);
router.post('/payments', billCtrl.addPayment);
router.get('/billing/daily-summary', billCtrl.getDailySummary);

// Inventory
router.post('/inventory', validateRequest(invCtrl.inventoryItemSchema), invCtrl.createInventoryItem);
router.get('/inventory', invCtrl.getInventoryItems);
router.put('/inventory/:id', invCtrl.updateInventoryItem);
router.delete('/inventory/:id', authorizeRoles('SUPER_ADMIN', 'OWNER'), invCtrl.deleteInventoryItem);

// Treatments & Treatment Plans
router.post('/treatments', validateRequest(treatCtrl.treatmentSchema), treatCtrl.createTreatment);
router.get('/treatments', treatCtrl.getTreatments);
router.put('/treatments/:id', treatCtrl.updateTreatment);
router.delete('/treatments/:id', authorizeRoles('SUPER_ADMIN', 'OWNER'), treatCtrl.deleteTreatment);

router.post('/treatment-plans', validateRequest(treatCtrl.treatmentPlanSchema), treatCtrl.createTreatmentPlan);
router.get('/treatment-plans/patient/:patientId', treatCtrl.getPatientTreatmentPlans);
router.put('/treatment-plans/item/:itemId', treatCtrl.updateTreatmentPlanItemStatus);

// Clinical Tasks
router.post('/tasks', validateRequest(taskCtrl.taskSchema), taskCtrl.createTask);
router.get('/tasks', taskCtrl.getTasks);
router.put('/tasks/:id', taskCtrl.updateTask);
router.delete('/tasks/:id', taskCtrl.deleteTask);

// Recalls
router.post('/recalls', validateRequest(recallCtrl.recallSchema), recallCtrl.createRecall);
router.get('/recalls', recallCtrl.getRecalls);
router.put('/recalls/:id', recallCtrl.updateRecall);
router.delete('/recalls/:id', recallCtrl.deleteRecall);

// Clinic Settings & Users
router.get('/settings', setCtrl.getClinicSettings);
router.put('/settings', authorizeRoles('SUPER_ADMIN', 'OWNER'), validateRequest(setCtrl.clinicUpdateSchema), setCtrl.updateClinicSettings);
router.get('/settings/users', setCtrl.getClinicUsers);
router.post('/settings/users', authorizeRoles('SUPER_ADMIN', 'OWNER'), validateRequest(setCtrl.userCreateSchema), setCtrl.createClinicUser);
router.put('/settings/users/:id', authorizeRoles('SUPER_ADMIN', 'OWNER'), setCtrl.updateClinicUser);
router.put('/settings/subscription', authorizeRoles('SUPER_ADMIN', 'OWNER'), setCtrl.updateSubscription);

// Reports & Analytics (PRO subscription tier required)
router.get('/reports', reportCtrl.getReports);

export default router;
