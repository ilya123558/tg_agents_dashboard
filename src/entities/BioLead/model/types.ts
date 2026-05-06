export type BioLeadStatus = 'новый' | 'отправлено' | 'ответил' | 'не ответил' | 'архив';
export type BioReadiness  = 'горячий' | 'тёплый' | 'холодный';
export type BioExpertise  = 'разбирается' | 'новичок';
export type BioGender     = 'мужской' | 'женский';

export interface BioLead {
  id:          string;
  text:        string;
  group:       string;
  date:        string | null;
  link:        string | null;
  author:      string | null;
  comment:     string;
  status:      BioLeadStatus;
  problem:     string;
  location:    string | null;
  age:         string | null;
  gender:      BioGender | null;
  phone:       string | null;
  personality: string;
  readiness:   BioReadiness | null;
  requestType: string | null;
  markers:     string | null;
  expertise:   BioExpertise | null;
}
