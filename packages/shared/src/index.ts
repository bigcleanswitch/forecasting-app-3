// Business model types
export type BusinessModel = 'B2C' | 'B2B' | 'B2B2C' | 'Marketplace' | 'API/Platform' | 'Hybrid';

// Revenue model types
export type RevenueModel = 
  | 'Recurring'
  | 'OneOff'
  | 'PerUnit'
  | 'Commission'
  | 'Freemium';

// Go-to-market channels
export type GoToMarketChannel = 
  | 'Direct Sales'
  | 'Partnerships'
  | 'Retail'
  | 'Platform Integrations'
  | 'Employer Rollouts'
  | 'Organic'
  | 'Paid Media'
  | 'Referral'
  | 'Partnership';

// User and team types
export type UserRole = 'owner' | 'member' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  maxMembers: number;
}

// Client tier structure
export interface ClientTier {
  id: string;
  name?: string;
  tierBottom: number;
  tierTop: number;
}

// Revenue stream configuration
export interface RevenueStream {
  id: string;
  name: string;
  model: RevenueModel;
  pricing: PricingConfig;
  minimumGuarantee?: MinimumGuarantee;
  uplifts?: UpliftConfig;
}

export interface PricingConfig {
  basePrice: number;
  currency: string;
  billingFrequency: 'monthly' | 'annually';
  tiered?: TieredPricing[];
  perUnit?: boolean;
}

export interface TieredPricing {
  tierBottom: number;
  tierTop: number;
  price: number;
}

export interface MinimumGuarantee {
  type: 'fixed' | 'users' | 'annual';
  value: number;
  offsetUsage: boolean;
  billingFrequency: 'monthly' | 'annually';
}

export interface UpliftConfig {
  annualIncrease: number;
  startDate: Date;
}

// User growth configuration
export interface GrowthCurve {
  steepness: number; // 0-1, determines how sharp the S-curve is
  offset: number; // months to delay growth onset
  length: number; // total duration in months
}

export interface ClientGrowth {
  targetClients: number;
  startDate: Date;
  endDate: Date;
  curve: GrowthCurve;
  tierSpecific?: Record<string, ClientGrowth>;
}

export interface UserAdoption {
  rolloutPeriod: number; // months
  curve: GrowthCurve;
  retentionRate: number; // percentage
  churnRate: number; // percentage per month
}

export interface DirectUserAcquisition {
  channel: GoToMarketChannel;
  monthlyAcquisitions: number;
  startDate: Date;
  costPerAcquisition?: number;
}

// Cost drivers
export interface TeamMember {
  role: string;
  startDate: Date;
  baseSalary: number;
  inflationUplift: number;
  onCosts: number; // percentage
}

export interface CustomerAcquisition {
  costPerLead: number;
  costPerAcquisition: number;
  marketingBudgetPercent: number;
  salesTeamCosts: number;
}

export interface Infrastructure {
  tieredPricing: TieredPricing[];
  externalAPIs: number;
  dataLicensing: number;
}

export interface AssessmentCosts {
  costPerUnit: number;
  minimumGuarantee: number;
  supplierTiers: TieredPricing[];
}

export interface Overheads {
  insurance: number;
  office: number;
  software: number;
  professionalServices: number;
}

// Complete assumptions structure
export interface ForecastAssumptions {
  // Step 1: Business Type, Launch Date, and Go-to-Market Strategy
  businessModel: BusinessModel;
  launchDate: Date;
  goToMarketChannels: GoToMarketChannel[];
  clientTiers: ClientTier[];
  
  // Step 2: Pricing Assumptions
  revenueStreams: RevenueStream[];
  
  // Step 3: User Growth Assumptions
  growthCurve: GrowthCurve;
  clientGrowth?: ClientGrowth;
  userAdoption?: UserAdoption;
  directUserAcquisition?: DirectUserAcquisition[];
  
  // Step 4: Key Cost Drivers
  teamMembers: TeamMember[];
  customerAcquisition: CustomerAcquisition;
  infrastructure: Infrastructure;
  assessmentCosts?: AssessmentCosts;
  overheads: Overheads;
}

export interface Forecast {
  id: string;
  teamId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assumptions: ForecastAssumptions;
  // Add more forecast fields as needed
}

// Form step types for the wizard
export type AssumptionStep = 
  | 'business-type'
  | 'pricing'
  | 'user-growth'
  | 'cost-drivers'
  | 'review';

export interface AssumptionFormState {
  currentStep: AssumptionStep;
  assumptions: Partial<ForecastAssumptions>;
  isComplete: boolean;
} 