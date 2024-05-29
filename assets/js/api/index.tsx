export interface Company {
  id: string;
  name: string;
  mission: string;
  companySpaceId: string;
}

export interface Person {
  id: string;
  managerId: string;
  fullName: string;
  title: string;
  avatarUrl: string;
  timezone: string;
  companyRole: string;
  email: string;
  sendDailySummary: boolean;
  notifyOnMention: boolean;
  notifyAboutAssignments: boolean;
  suspended: boolean;
  company: Company;
  manager: Person;
  theme: string;
}
