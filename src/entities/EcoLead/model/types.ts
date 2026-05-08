export type EcoLeadStatus = 'новый' | 'отправлено' | 'ответил' | 'не ответил' | 'архив';
export type EcoReadiness  = 'горячий' | 'тёплый' | 'холодный';
export type EcoExpertise  = 'разбирается' | 'новичок';
export type EcoGender     = 'мужской' | 'женский';

export interface EcoLead {
  id:          string;
  text:        string;
  group:       string;
  date:        string | null;
  link:        string | null;
  author:      string | null;
  comment:     string;
  status:      EcoLeadStatus;
  problem:     string;
  location:    string | null;
  age:         string | null;
  gender:      EcoGender | null;
  phone:       string | null;
  personality: string;
  readiness:   EcoReadiness | null;
  requestType: string | null;
  markers:     string | null;
  expertise:   EcoExpertise | null;
  context:     string | null;
}
