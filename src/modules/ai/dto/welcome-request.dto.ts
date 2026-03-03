export class WelcomeRequestDto {
  companyId: string;
  employeeName?: string;
  department?: string;
  tags?: {
    roles?: string[];
    skills?: string[];
    interests?: string[];
  };
}
