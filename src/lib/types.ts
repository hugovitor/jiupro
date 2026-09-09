export type Role = "owner" | "instructor" | "student";

export type AdultBeltId =
  | "white"
  | "blue"
  | "purple"
  | "brown"
  | "black"
  | "coral_red_black"
  | "coral_red_white"
  | "red";

export type KidsBeltId =
  | "white"
  | "grey_white"
  | "grey"
  | "grey_black"
  | "yellow_white"
  | "yellow"
  | "yellow_black"
  | "orange_white"
  | "orange"
  | "orange_black"
  | "green_white"
  | "green"
  | "green_black";

export type BeltId = AdultBeltId | KidsBeltId;

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
  pixKey: string;
  pixName: string;
  plan: PlanId;
  monthlyGoal: number;
  dropInFee: number;
  createdAt: string;
  joinCode: string;
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
  belt: BeltId;
  stripes: number;
  joinDate: string;
  lastPromotionDate: string;
  status: StudentStatus;
  monthlyFee: number;
  notes: string;
  avatarHue: number;
  cpf?: string;
  asaasCustomerId?: string;
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

export type AttendanceStatus = "pending" | "validated" | "no_show";

export type Attendance = {
  id: string;
  academyId: string;
  studentId: string;
  classId: string;
  date: string;
  checkedInAt: string;
  method: "app" | "manual" | "code";
  /** Ausente = registro antigo (já valido). */
  status?: AttendanceStatus;
  validatedAt?: string;
  validatedBy?: string;
};

export type Evaluation = {
  id: string;
  academyId: string;
  studentId: string;
  date: string;
  instructorName: string;
  notes: string;
  recommendPromotion: boolean;
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
  asaasPaymentId?: string;
  asaasInvoiceUrl?: string;
  asaasPixCopy?: string;
  asaasStatus?: string;
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

export type EventKind =
  | "seminar"
  | "championship"
  | "openmat"
  | "extra"
  | "graduation";

export type AcademyEvent = {
  id: string;
  academyId: string;
  title: string;
  kind: EventKind;
  date: string;
  time: string;
  place: string;
  notes: string;
  fee: number;
  goingIds: string[];
};

export type Sale = {
  id: string;
  academyId: string;
  studentId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  amount: number;
  date: string;
  method: "pix" | "cash" | "card";
};

export type DropIn = {
  id: string;
  academyId: string;
  name: string;
  phone: string;
  classId: string;
  date: string;
  amount: number;
  method: "pix" | "cash";
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
  evaluations: Evaluation[];
  posts: Post[];
  events: AcademyEvent[];
  sales: Sale[];
  dropIns: DropIn[];
  session: Session | null;
};
