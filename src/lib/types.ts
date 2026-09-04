export type Role = "owner" | "instructor" | "student";

export type BeltId = "white" | "blue" | "purple" | "brown" | "black";
export type KidsBeltId = "grey" | "yellow" | "orange" | "green";

export type StudentStatus = "active" | "inactive" | "trial";
export type PaymentStatus = "paid" | "pending" | "overdue" | "waived";
export type PlanId = "essencial" | "academia" | "equipe";
export type InventoryCategory = "kimono" | "belt" | "apparel" | "gear" | "other";
export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "instructor"
  | "supplies"
  | "marketing"
  | "other";

export type Session = {
  userId: string;
  academyId: string;
  role: Role;
};

export type Academy = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  instagram: string;
  plan: PlanId;
  monthlyGoal: number;
  createdAt: string;
};

export type User = {
  id: string;
  academyId: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  avatarHue: number;
};

export type Student = {
  id: string;
  academyId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  guardianName?: string;
  division: "adult" | "kids";
  belt: BeltId | KidsBeltId;
  stripes: number;
  joinDate: string;
  lastPromotionDate: string;
  status: StudentStatus;
  monthlyFee: number;
  notes: string;
  avatarHue: number;
};

export type ClassSession = {
  id: string;
  academyId: string;
  name: string;
  weekday: number;
  startTime: string;
  durationMin: number;
  instructorId: string;
  division: "adult" | "kids" | "mixed";
  gi: boolean;
  capacity: number;
};

export type Attendance = {
  id: string;
  academyId: string;
  studentId: string;
  classId: string;
  date: string;
  checkedInAt: string;
  method: "app" | "manual";
};

export type Payment = {
  id: string;
  academyId: string;
  studentId: string;
  month: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  method?: "pix" | "card" | "cash" | "transfer";
};

export type Expense = {
  id: string;
  academyId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
};

export type InventoryItem = {
  id: string;
  academyId: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  size?: string;
  quantity: number;
  minQuantity: number;
  cost: number;
  price: number;
};

export type Graduation = {
  id: string;
  academyId: string;
  studentId: string;
  fromBelt: string;
  toBelt: string;
  stripes: number;
  date: string;
  notes: string;
};

export type Post = {
  id: string;
  academyId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  pinned?: boolean;
  createdAt: string;
  likedBy: string[];
};

export type AppState = {
  version: number;
  academy: Academy;
  users: User[];
  students: Student[];
  classes: ClassSession[];
  attendance: Attendance[];
  payments: Payment[];
  expenses: Expense[];
  inventory: InventoryItem[];
  graduations: Graduation[];
  posts: Post[];
  session: Session | null;
};
