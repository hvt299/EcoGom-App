export interface ProcessingStep {
  step_order: number;
  content: string;
}

export interface Waste {
  _id: string;
  name: string;
  local_names: string[];
  category: string;
  estimated_price: string;
  images: string[];
  processing_steps: ProcessingStep[];
  is_active: boolean;
}

export interface ScheduleResponse {
  type: 'SPECIAL' | 'STANDARD' | 'NONE';
  message: string;
  is_cancelled: boolean;
  time?: string;
  waste_type?: string;
  note?: string;
}

export interface Location {
  _id: string;
  name: string;
  type: string;
  address_hint: string;
  location: { coordinates: [number, number] }; // [Long, Lat]
}