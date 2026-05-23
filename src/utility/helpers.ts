import { randomBytes } from 'crypto';

export function randomString(length: number): string {
  return randomBytes(length).toString('hex');
}

export function shortOrder(orderBy: string, sortOrder: 'ASC' | 'DESC'): any[] {
  // Handle nested sorting (e.g., 'patient.patientProfile.firstName')
  if (orderBy.includes('.')) {
    const parts = orderBy.split('.');
    
    
    // The last part is the column name, everything before is associations
    const orderArray: any[] = [...parts, sortOrder];
    return [orderArray];
  }

  // Simple column sorting (no relations)
  return [[orderBy, sortOrder]];
}
