"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding DentaCare SQLite database with premium mock data...');
    // Delete existing data to prevent unique constraint failures on multiple seeding runs
    try {
        await prisma.clinicSetting.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.toothHistory.deleteMany({});
        await prisma.appointment.deleteMany({});
        await prisma.inventoryItem.deleteMany({});
        await prisma.task.deleteMany({});
        await prisma.recall.deleteMany({});
        await prisma.prescriptionItem.deleteMany({});
        await prisma.prescription.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.invoice.deleteMany({});
        await prisma.visit.deleteMany({});
        await prisma.patient.deleteMany({});
        await prisma.treatment.deleteMany({});
        await prisma.treatmentPlan.deleteMany({});
        await prisma.clinic.deleteMany({});
    }
    catch (err) {
        console.log('No prior tables to flush, proceeding...');
    }
    // 1. Create a Demo Clinic
    const demoClinic = await prisma.clinic.create({
        data: {
            name: 'DentaCare Elite Clinic (Delhi)',
            email: 'contact@dentacaredemo.com',
            phone: '011-23456789',
            address: 'Suite 201, Green Park Extension, New Delhi, India',
            gstNumber: '07AAAAA1111A1Z1',
            subscription: 'PRO', // Unlock all premium features
        },
    });
    console.log(`Clinic Created: ${demoClinic.name}`);
    // 2. Create Settings
    await prisma.clinicSetting.create({
        data: {
            clinicId: demoClinic.id,
            primaryColor: '#3B82F6',
            currency: 'INR',
            smsEnabled: false,
            emailNotifications: true,
        },
    });
    // 3. Create Users
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    const owner = await prisma.user.create({
        data: {
            clinicId: demoClinic.id,
            name: 'Dr. Ramesh Sharma',
            email: 'owner@dentacare.com',
            passwordHash,
            role: 'OWNER',
            isActive: true,
        },
    });
    const doctor = await prisma.user.create({
        data: {
            clinicId: demoClinic.id,
            name: 'Dr. Priya Patel',
            email: 'doctor@dentacare.com',
            passwordHash,
            role: 'DOCTOR',
            isActive: true,
        },
    });
    const assistant = await prisma.user.create({
        data: {
            clinicId: demoClinic.id,
            name: 'Aarav Singh',
            email: 'assistant@dentacare.com',
            passwordHash,
            role: 'ASSISTANT',
            isActive: true,
        },
    });
    console.log('Mock Users Seeded: owner@dentacare.com, doctor@dentacare.com, assistant@dentacare.com');
    // 4. Create Standard Treatment Catalog
    const treatments = [
        { category: 'Diagnostic', name: 'Consultation & X-Ray', defaultCost: 500 },
        { category: 'Preventative', name: 'Dental Scaling & Polishing', defaultCost: 1500 },
        { category: 'Restorative', name: 'Composite Teeth Filling', defaultCost: 2000 },
        { category: 'Endodontics', name: 'Root Canal Treatment (RCT)', defaultCost: 6500 },
        { category: 'Prosthodontics', name: 'Zirconia Dental Crown', defaultCost: 12000 },
        { category: 'Surgical', name: 'Wisdom Tooth Extraction', defaultCost: 5000 },
        { category: 'Orthodontics', name: 'Metal Braces Treatment', defaultCost: 35000 },
        { category: 'Implants', name: 'Titanium Single Tooth Implant', defaultCost: 45000 },
    ];
    for (const t of treatments) {
        await prisma.treatment.create({
            data: {
                clinicId: demoClinic.id,
                category: t.category,
                name: t.name,
                defaultCost: t.defaultCost,
                isActive: true,
            },
        });
    }
    // 5. Create Patients
    const patient1 = await prisma.patient.create({
        data: {
            clinicId: demoClinic.id,
            patientNumber: 'DC-0001',
            name: 'Rajesh Kumar',
            phone: '9876543210',
            email: 'rajesh.kumar@email.com',
            gender: 'Male',
            dob: new Date('1988-05-15'),
            address: 'H.No 45, Sector 15, Noida, UP',
            medicalHistory: JSON.stringify(['Hypertension']),
            allergies: JSON.stringify(['Penicillin']),
            emergencyContact: 'Sunita Kumar',
            emergencyPhone: '9876543211',
        },
    });
    const patient2 = await prisma.patient.create({
        data: {
            clinicId: demoClinic.id,
            patientNumber: 'DC-0002',
            name: 'Aditi Verma',
            phone: '9988776655',
            email: 'aditi.verma@email.com',
            gender: 'Female',
            dob: new Date('1995-10-22'),
            address: 'Flat 102, Shanti Vihar, Delhi',
            medicalHistory: '[]',
            allergies: '[]',
            emergencyContact: 'Sanjay Verma',
            emergencyPhone: '9988776656',
        },
    });
    const patient3 = await prisma.patient.create({
        data: {
            clinicId: demoClinic.id,
            patientNumber: 'DC-0003',
            name: 'Amit Patel',
            phone: '9123456789',
            email: 'amit.patel@email.com',
            gender: 'Male',
            dob: new Date('1975-02-10'),
            address: '22, Rosewood Apartment, Gurgaon',
            medicalHistory: JSON.stringify(['Diabetes Type 2']),
            allergies: JSON.stringify(['Sulfa drugs']),
            emergencyContact: 'Komal Patel',
            emergencyPhone: '9123456780',
        },
    });
    console.log('Patients Seeded successfully');
    // 6. Create Dental Tooth History
    await prisma.toothHistory.createMany({
        data: [
            { patientId: patient1.id, toothNumber: 14, status: 'DECAYED', notes: 'Deep occlusal caries' },
            { patientId: patient1.id, toothNumber: 16, status: 'FILLED', notes: 'Composite restoration done 2024' },
            { patientId: patient1.id, toothNumber: 48, status: 'MISSING', notes: 'Congenitally missing' },
            { patientId: patient2.id, toothNumber: 21, status: 'DECAYED', notes: 'Incipient interproximal decay' },
            { patientId: patient2.id, toothNumber: 36, status: 'ROOT_CANAL', notes: 'Needs crown post-RCT' },
        ],
    });
    // 7. Create Appointments
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    await prisma.appointment.createMany({
        data: [
            {
                clinicId: demoClinic.id,
                patientId: patient1.id,
                doctorId: doctor.id,
                dateTime: new Date(today.setHours(10, 0, 0, 0)),
                durationMinutes: 30,
                status: 'SCHEDULED',
                reason: 'Root Canal follow-up',
            },
            {
                clinicId: demoClinic.id,
                patientId: patient2.id,
                doctorId: owner.id,
                dateTime: new Date(today.setHours(11, 30, 0, 0)),
                durationMinutes: 45,
                status: 'CHECKED_IN',
                reason: 'Scaling and Polishing',
            },
            {
                clinicId: demoClinic.id,
                patientId: patient3.id,
                doctorId: doctor.id,
                dateTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
                durationMinutes: 60,
                status: 'SCHEDULED',
                reason: 'Consultation for dental implant',
            },
        ],
    });
    // 8. Seed Clinic Inventory
    await prisma.inventoryItem.createMany({
        data: [
            { clinicId: demoClinic.id, name: 'Dental Composite Resin (A2)', category: 'Material', quantity: 12, minQuantityAlert: 3, expiryDate: new Date('2027-08-01') },
            { clinicId: demoClinic.id, name: 'Anaesthetic Cartridges (Lignox)', category: 'Anaesthesia', quantity: 3, minQuantityAlert: 10, expiryDate: new Date('2026-12-15') }, // Low stock!
            { clinicId: demoClinic.id, name: 'Autoclave Sterilizer (B-Class)', category: 'Equipment', condition: 'Excellent', quantity: 1, minQuantityAlert: 0 },
            { clinicId: demoClinic.id, name: 'Disposable Mouth Mirrors', category: 'Consumables', quantity: 150, minQuantityAlert: 30 },
            { clinicId: demoClinic.id, name: 'Amoxicillin 500mg capsules', category: 'Medicine', quantity: 80, minQuantityAlert: 20, expiryDate: new Date('2027-04-10') },
        ],
    });
    // 9. Tasks
    await prisma.task.createMany({
        data: [
            { clinicId: demoClinic.id, title: 'Call Dr. Verma for Orthodontic cases approval', priority: 'Medium', status: 'Todo', dueDate: tomorrow },
            { clinicId: demoClinic.id, title: 'Autoclave water tank filter replacement', priority: 'High', status: 'In Progress', dueDate: today },
            { clinicId: demoClinic.id, title: 'Send inventory list to supplier', priority: 'Low', status: 'Todo' },
        ],
    });
    // 10. Recalls
    await prisma.recall.createMany({
        data: [
            { clinicId: demoClinic.id, patientId: patient1.id, recallType: 'ROUTINE_CHECKUP', dueDate: new Date(today.setMonth(today.getMonth() + 6)), status: 'Pending' },
            { clinicId: demoClinic.id, patientId: patient2.id, recallType: 'CLEANING', dueDate: new Date(today.setMonth(today.getMonth() + 3)), status: 'Pending' },
        ],
    });
    // 11. Clinical Visit, Invoice and Prescription
    const visit = await prisma.visit.create({
        data: {
            patientId: patient1.id,
            chiefComplaint: 'Severe throbbing pain in upper left back tooth',
            diagnosis: 'Irreversible Pulpitis in Tooth #14',
            clinicalNotes: 'Initiated RCT. Access cavity done, working length determined. Biomechanical preparation completed. Intracanal medicament (calcium hydroxide) placed. Temporary restoration with Cavit. Patient scheduled for obturation.',
        },
    });
    await prisma.prescription.create({
        data: {
            visitId: visit.id,
            doctorSignature: 'Dr. Priya Patel',
            items: {
                create: [
                    { medicineName: 'Amoxicillin 500mg', dosage: '1-0-1', durationDays: 5, instructions: 'After food' },
                    { medicineName: 'Ibuprofen 400mg', dosage: '1-1-1', durationDays: 3, instructions: 'After food, SOS for pain' },
                    { medicineName: 'Pantocid 40mg', dosage: '1-0-0', durationDays: 5, instructions: 'Empty stomach' },
                ],
            },
        },
    });
    const subtotal = 6500;
    const discount = 500;
    const taxableAmount = subtotal - discount;
    const cgst = 9; // 9%
    const sgst = 9; // 9%
    const total = taxableAmount + taxableAmount * 0.18; // 18% total GST
    const invoice = await prisma.invoice.create({
        data: {
            clinicId: demoClinic.id,
            patientId: patient1.id,
            visitId: visit.id,
            invoiceNumber: 'INV-00001',
            subtotal,
            discount,
            taxableAmount,
            cgst,
            sgst,
            total,
            balance: total - 3000, // Partially paid
            paymentStatus: 'PARTIAL',
        },
    });
    await prisma.payment.create({
        data: {
            invoiceId: invoice.id,
            amount: 3000,
            paymentMode: 'UPI',
            referenceNumber: 'TXN88223199',
        },
    });
    console.log('Clinical Visit, Prescription, Invoice and Payments Seeded!');
    console.log('Database seeding finished successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
