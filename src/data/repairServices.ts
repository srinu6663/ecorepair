export interface RepairService {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
  specialties: string[];
  categories: string[];
  rating: number;
  reviewCount: number;
  distance?: number;
  verified: boolean;
  image?: string;
}

export const categories = [
  { id: "mobile", label: "Mobile Phones", icon: "Smartphone" },
  { id: "laptop", label: "Laptops & Computers", icon: "Laptop" },
  { id: "appliances", label: "Home Appliances", icon: "Refrigerator" },
  { id: "electronics", label: "Electronics", icon: "Tv" },
  { id: "clothing", label: "Clothing & Textiles", icon: "Shirt" },
  { id: "furniture", label: "Furniture", icon: "Armchair" },
  { id: "bikes", label: "Bikes & Scooters", icon: "Bike" },
  { id: "tools", label: "Tools & Equipment", icon: "Wrench" },
] as const;

export const repairServices: RepairService[] = [
  {
    id: "1",
    name: "TechFix Pro",
    address: "123 Main Street",
    city: "San Francisco",
    zipCode: "94102",
    phone: "(415) 555-0123",
    email: "contact@techfixpro.com",
    specialties: ["Screen Repair", "Battery Replacement", "Water Damage"],
    categories: ["mobile", "laptop"],
    rating: 4.8,
    reviewCount: 234,
    distance: 0.5,
    verified: true,
  },
  {
    id: "2",
    name: "Green Appliance Repair",
    address: "456 Oak Avenue",
    city: "San Francisco",
    zipCode: "94103",
    phone: "(415) 555-0456",
    email: "info@greenappliancerepair.com",
    specialties: ["Refrigerator Repair", "Washer/Dryer", "Dishwasher"],
    categories: ["appliances"],
    rating: 4.6,
    reviewCount: 189,
    distance: 1.2,
    verified: true,
  },
  {
    id: "3",
    name: "Stitch & Fix Tailoring",
    address: "789 Market Street",
    city: "San Francisco",
    zipCode: "94104",
    phone: "(415) 555-0789",
    email: "hello@stitchfix.local",
    specialties: ["Alterations", "Zipper Replacement", "Patching"],
    categories: ["clothing"],
    rating: 4.9,
    reviewCount: 312,
    distance: 0.8,
    verified: true,
  },
  {
    id: "4",
    name: "Circuit Board Masters",
    address: "321 Tech Boulevard",
    city: "San Francisco",
    zipCode: "94105",
    phone: "(415) 555-0321",
    email: "repair@cbmasters.com",
    specialties: ["PCB Repair", "Soldering", "Console Repair"],
    categories: ["electronics", "laptop"],
    rating: 4.7,
    reviewCount: 156,
    distance: 2.1,
    verified: false,
  },
  {
    id: "5",
    name: "Furniture Revival Co.",
    address: "555 Woodwork Lane",
    city: "San Francisco",
    zipCode: "94106",
    phone: "(415) 555-0555",
    email: "restore@furniturerevival.com",
    specialties: ["Wood Restoration", "Upholstery", "Refinishing"],
    categories: ["furniture"],
    rating: 4.5,
    reviewCount: 98,
    distance: 3.4,
    verified: true,
  },
  {
    id: "6",
    name: "Bay Area Bike Shop",
    address: "888 Cycle Street",
    city: "San Francisco",
    zipCode: "94107",
    phone: "(415) 555-0888",
    email: "pedal@bayareabikes.com",
    specialties: ["Tune-ups", "Brake Repair", "Wheel Truing"],
    categories: ["bikes"],
    rating: 4.8,
    reviewCount: 267,
    distance: 1.5,
    verified: true,
  },
  {
    id: "7",
    name: "iDevice Clinic",
    address: "100 Apple Way",
    city: "San Francisco",
    zipCode: "94108",
    phone: "(415) 555-0100",
    email: "fix@ideviceclinic.com",
    specialties: ["iPhone Repair", "iPad Repair", "MacBook Repair"],
    categories: ["mobile", "laptop"],
    rating: 4.9,
    reviewCount: 445,
    distance: 0.3,
    verified: true,
  },
  {
    id: "8",
    name: "Home Helper Repairs",
    address: "222 Service Road",
    city: "San Francisco",
    zipCode: "94109",
    phone: "(415) 555-0222",
    email: "help@homehelper.com",
    specialties: ["Small Appliances", "Vacuum Repair", "Coffee Machines"],
    categories: ["appliances", "electronics"],
    rating: 4.4,
    reviewCount: 87,
    distance: 2.8,
    verified: false,
  },
];

export const ewateStats = {
  globalEwastePerYear: "53.6 million",
  ewateGrowthRate: "21%",
  recycledPercentage: "17.4%",
  averageRepairSavings: "60-70%",
  carbonSavedPerRepair: "25-50kg",
  jobsCreatedPerRepairShop: "3-5",
};
