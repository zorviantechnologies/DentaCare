"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReports = void 0;
const prisma_1 = require("../prisma");
const subscription_service_1 = require("../services/subscription.service");
const getReports = async (req, res) => {
    const clinicId = req.user?.clinicId;
    try {
        // 1. Enforce Subscription Level (Reports and Analytics are PRO-tier only)
        await (0, subscription_service_1.checkSubscriptionLimit)(clinicId, 'FEATURES', 'ANALYTICS');
        // 2. Fetch data for calculations
        const invoices = await prisma_1.prisma.invoice.findMany({
            where: { clinicId },
            include: { payments: true },
        });
        const appointments = await prisma_1.prisma.appointment.findMany({
            where: { clinicId },
        });
        const patients = await prisma_1.prisma.patient.findMany({
            where: { clinicId },
            select: { createdAt: true, gender: true },
        });
        const inventory = await prisma_1.prisma.inventoryItem.findMany({
            where: { clinicId },
        });
        // 3. Compute Totals
        const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0), 0);
        const totalPending = totalBilled - totalCollected;
        // 4. Monthly Revenue Trend (for the last 6 months)
        const monthlyRevenue = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        invoices.forEach((inv) => {
            const date = new Date(inv.createdAt);
            const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
            if (!monthlyRevenue[key]) {
                monthlyRevenue[key] = { billed: 0, collected: 0 };
            }
            monthlyRevenue[key].billed += inv.total;
            monthlyRevenue[key].collected += inv.payments.reduce((s, p) => s + p.amount, 0);
        });
        // 5. Patient Growth Trend (Group by month)
        const monthlyPatientGrowth = {};
        patients.forEach((p) => {
            const date = new Date(p.createdAt);
            const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
            monthlyPatientGrowth[key] = (monthlyPatientGrowth[key] || 0) + 1;
        });
        // 6. Appointment Status Breakdown
        const appointmentBreakdown = {
            SCHEDULED: 0,
            CHECKED_IN: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            CANCELLED: 0,
            NO_SHOW: 0,
        };
        appointments.forEach((apt) => {
            appointmentBreakdown[apt.status] = (appointmentBreakdown[apt.status] || 0) + 1;
        });
        // 7. Inventory Low Stock Alerts Count
        const lowStockCount = inventory.filter((item) => item.quantity <= item.minQuantityAlert).length;
        // 8. Payment mode collections
        const collectionsByMode = {
            CASH: 0,
            UPI: 0,
            CARD: 0,
            CHEQUE: 0,
            NET_BANKING: 0,
        };
        invoices.forEach((inv) => {
            inv.payments.forEach((pay) => {
                collectionsByMode[pay.paymentMode] = (collectionsByMode[pay.paymentMode] || 0) + pay.amount;
            });
        });
        // 9. Gender demographics breakdown
        const genderDemographics = {
            Male: 0,
            Female: 0,
            Other: 0,
            Unspecified: 0,
        };
        patients.forEach((p) => {
            if (p.gender === 'Male')
                genderDemographics.Male++;
            else if (p.gender === 'Female')
                genderDemographics.Female++;
            else if (p.gender === 'Other')
                genderDemographics.Other++;
            else
                genderDemographics.Unspecified++;
        });
        return res.json({
            summary: {
                totalBilled,
                totalCollected,
                totalPending,
                totalAppointments: appointments.length,
                totalPatients: patients.length,
                lowStockAlerts: lowStockCount,
            },
            monthlyRevenue,
            monthlyPatientGrowth,
            appointmentBreakdown,
            collectionsByMode,
            genderDemographics,
        });
    }
    catch (error) {
        return res.status(403).json({ error: error.message });
    }
};
exports.getReports = getReports;
