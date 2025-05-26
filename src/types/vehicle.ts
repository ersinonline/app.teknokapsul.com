export interface Vehicle {
  id: string;
  userId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  lastInspectionDate: string;
  nextInspectionDate: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  insuranceEndDate: string;
  documents: {
    insurance?: string; // PDF URL
    inspection?: string; // PDF URL
    maintenance?: string; // PDF URL
  };
  notes?: string;
  createdAt: string;
}

export interface VehicleFormData {
  plate: string;
  brand: string;
  model: string;
  year: number;
  lastInspectionDate?: string;
  lastMaintenanceDate?: string;
  insuranceEndDate?: string;
  notes?: string;
}