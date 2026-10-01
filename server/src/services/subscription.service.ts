import { prisma } from '../prisma';

export const checkSubscriptionLimit = async (
  clinicId: string,
  type: 'PATIENTS' | 'USERS' | 'FEATURES',
  featureName?: string
) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });

  if (!clinic) {
    throw new Error('Clinic not found');
  }

  const plan = clinic.subscription;

  if (type === 'PATIENTS') {
    const patientCount = await prisma.patient.count({
      where: { clinicId },
    });

    if (plan === 'FREE' && patientCount >= 50) {
      throw new Error('Patient limit reached (max 50 for FREE plan). Please upgrade to a higher plan.');
    }
    if (plan === 'BASIC' && patientCount >= 500) {
      throw new Error('Patient limit reached (max 500 for BASIC plan). Please upgrade to a higher plan.');
    }
  }

  if (type === 'USERS') {
    const userCount = await prisma.user.count({
      where: { clinicId },
    });

    if (plan === 'FREE' && userCount >= 2) {
      throw new Error('User limit reached (max 2 for FREE plan). Please upgrade to a higher plan.');
    }
    if (plan === 'BASIC' && userCount >= 5) {
      throw new Error('User limit reached (max 5 for BASIC plan). Please upgrade to a higher plan.');
    }
  }

  if (type === 'FEATURES' && featureName) {
    // Feature gate logic
    if (plan === 'FREE') {
      const basicFeatures = ['SCHEDULING', 'BILLING'];
      if (!basicFeatures.includes(featureName.toUpperCase())) {
        throw new Error(`The feature '${featureName}' is not available on the FREE plan. Please upgrade.`);
      }
    }

    if (plan === 'BASIC') {
      const basicAndMediumFeatures = ['SCHEDULING', 'BILLING', 'CHART', 'PRESCRIPTIONS', 'PAYMENTS'];
      if (!basicAndMediumFeatures.includes(featureName.toUpperCase())) {
        throw new Error(`The feature '${featureName}' is not available on the BASIC plan. Please upgrade.`);
      }
    }
    
    // PRO plan allows everything
  }

  return clinic;
};
