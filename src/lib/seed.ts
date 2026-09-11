import { currentMonth, isoDate, shiftMonth, weekdayToday } from "./format";
import { sandboxCpf } from "./cpf";
import type {
  Academy,
  AcademyEvent,
  AppState,
  Attendance,
  ClassSession,
  Expense,
  Graduation,
  InventoryItem,
  Evaluation,
  Payment,
  Post,
  Sale,
  DropIn,
  Student,
  User,
} from "./types";

const ACADEMY_ID = "ac_origem";
export const DEMO_ACADEMY_ID = ACADEMY_ID;

function monthOffset(n: number) {
  return shiftMonth(currentMonth(), n);
}

function dateOnWeekday(weekday: number, weeksAgo: number) {
  const diff = (weekdayToday() - weekday + 7) % 7;
  return isoDate(-(diff + weeksAgo * 7));
}

export function createSeed(): AppState {
  let seq = 0;
  const seedId = (prefix: string) => {
    seq += 1;
    return `${prefix}_${String(seq).padStart(4, "0")}`;
  };

  const academy: Academy = {
    id: ACADEMY_ID,
    name: "Equipe Origem Jiu-Jitsu",
    slug: "origem-campinas",
    city: "Campinas",
    state: "SP",
    address: "Rua Barão de Jaguara, 412 — Centro",
    phone: "(19) 98812-4400",
    instagram: "@origemjj",
    pixKey: "origemjj@pix.com.br",
    pixName: "Equipe Origem Jiu-Jitsu",
    plan: "equipe",
    monthlyGoal: 18000,
    dropInFee: 40,
    createdAt: "2021-03-08T12:00:00.000Z",
    joinCode: "ORIGEM",
    brandLogo: "/origem-mark.svg",
    brandTagline: "Jiu-Jitsu",
  };

  const session = {
    userId: "u_carla",
    academyId: ACADEMY_ID,
    role: "owner" as const,
  };

  const users: User[] = [
    {
      id: "u_carla",
      academyId: ACADEMY_ID,
      name: "Carla Mendes",
      email: "carla@origem.jj",
      role: "owner",
      phone: "(19) 98812-4400",
      avatarHue: 38,
    },
    {
      id: "u_rafael",
      academyId: ACADEMY_ID,
      name: "Rafael Costa",
      email: "rafael@origem.jj",
      role: "instructor",
      phone: "(19) 99721-1188",
      avatarHue: 160,
    },
    {
      id: "u_joao",
      academyId: ACADEMY_ID,
      name: "João Pedro Almeida",
      email: "joao@aluno.origem",
      role: "student",
      phone: "(19) 98111-2233",
      avatarHue: 210,
    },
  ];

  const students: Student[] = [
    {
      id: "s_joao",
      academyId: ACADEMY_ID,
      userId: "u_joao",
      name: "João Pedro Almeida",
      email: "joao@aluno.origem",
      phone: "(19) 98111-2233",
      birthDate: "1996-04-12",
      division: "adult",
      belt: "blue",
      stripes: 2,
      joinDate: "2023-02-14",
      lastPromotionDate: "2025-11-20",
      status: "active",
      monthlyFee: 180,
      notes: "Treina competição aos sábados.",
      avatarHue: 210,
    },
    {
      id: "s_ana",
      academyId: ACADEMY_ID,
      userId: "u_ana",
      name: "Ana Carolina Souza",
      email: "ana@aluno.origem",
      phone: "(19) 99200-4411",
      birthDate: "1994-09-02",
      division: "adult",
      belt: "purple",
      stripes: 1,
      joinDate: "2019-08-01",
      lastPromotionDate: "2025-06-14",
      status: "active",
      monthlyFee: 180,
      notes: "Ajuda na turma feminina.",
      avatarHue: 310,
    },
    {
      id: "s_lucas",
      academyId: ACADEMY_ID,
      userId: "u_lucas",
      name: "Lucas Ferreira",
      email: "lucas@aluno.origem",
      phone: "(19) 98877-0091",
      birthDate: "2002-01-22",
      division: "adult",
      belt: "white",
      stripes: 1,
      joinDate: "2025-12-03",
      lastPromotionDate: "2026-04-10",
      status: "active",
      monthlyFee: 160,
      notes: "Mensalidade em atraso. Cobrar com cuidado — acabou de perder o emprego.",
      avatarHue: 20,
    },
    {
      id: "s_marina",
      academyId: ACADEMY_ID,
      userId: "u_marina",
      name: "Marina Oliveira",
      email: "marina@aluno.origem",
      phone: "(19) 98140-7788",
      birthDate: "1991-07-18",
      division: "adult",
      belt: "blue",
      stripes: 4,
      joinDate: "2022-05-09",
      lastPromotionDate: "2024-08-17",
      status: "active",
      monthlyFee: 180,
      notes: "Pronta para faixa roxa. Frequência alta.",
      avatarHue: 280,
    },
    {
      id: "s_thiago",
      academyId: ACADEMY_ID,
      userId: "u_thiago",
      name: "Thiago Santos",
      email: "thiago@aluno.origem",
      phone: "(19) 99765-3321",
      birthDate: "1988-11-03",
      division: "adult",
      belt: "brown",
      stripes: 2,
      joinDate: "2016-03-20",
      lastPromotionDate: "2025-01-25",
      status: "active",
      monthlyFee: 0,
      notes: "Professor assistente. Mensalidade isenta.",
      avatarHue: 12,
    },
    {
      id: "s_bia",
      academyId: ACADEMY_ID,
      userId: "u_bia",
      name: "Beatriz Lima",
      email: "bia@aluno.origem",
      phone: "(19) 98102-5566",
      birthDate: "2016-05-30",
      guardianName: "Patrícia Lima",
      division: "kids",
      belt: "yellow",
      stripes: 2,
      joinDate: "2024-02-12",
      lastPromotionDate: "2025-12-06",
      status: "active",
      monthlyFee: 140,
      notes: "Turma kids. Responsável: mãe Patrícia.",
      avatarHue: 50,
    },
    {
      id: "s_pedro",
      academyId: ACADEMY_ID,
      userId: "u_pedro",
      name: "Pedro Henrique Ramos",
      email: "pedro@aluno.origem",
      phone: "(19) 99901-8877",
      birthDate: "1985-02-14",
      division: "adult",
      belt: "black",
      stripes: 1,
      joinDate: "2012-01-10",
      lastPromotionDate: "2024-11-02",
      status: "active",
      monthlyFee: 0,
      notes: "Faixa preta. Dá aula de no-gi.",
      avatarHue: 0,
    },
    {
      id: "s_camila",
      academyId: ACADEMY_ID,
      userId: "u_camila",
      name: "Camila Rocha",
      email: "camila@aluno.origem",
      phone: "(19) 98222-1190",
      birthDate: "1998-12-09",
      division: "adult",
      belt: "purple",
      stripes: 3,
      joinDate: "2020-10-01",
      lastPromotionDate: "2024-09-21",
      status: "active",
      monthlyFee: 180,
      notes: "Dois meses em atraso. Sumiu das aulas há 3 semanas.",
      avatarHue: 330,
    },
    {
      id: "s_felipe",
      academyId: ACADEMY_ID,
      userId: "u_felipe",
      name: "Felipe Nunes",
      email: "felipe@aluno.origem",
      phone: "(19) 98840-2200",
      birthDate: "1999-06-16",
      division: "adult",
      belt: "blue",
      stripes: 0,
      joinDate: "2024-07-08",
      lastPromotionDate: "2025-09-13",
      status: "inactive",
      monthlyFee: 180,
      notes: "Parou de treinar em julho. Não cancelou formalmente.",
      avatarHue: 190,
    },
    {
      id: "s_sofia",
      academyId: ACADEMY_ID,
      userId: "u_sofia",
      name: "Sofia Martins",
      email: "sofia@aluno.origem",
      phone: "(19) 98177-3344",
      birthDate: "2015-08-21",
      guardianName: "Eduardo Martins",
      division: "kids",
      belt: "grey",
      stripes: 3,
      joinDate: "2025-03-04",
      lastPromotionDate: "2026-01-18",
      status: "active",
      monthlyFee: 140,
      notes: "Muito aplicada. Pai assiste todas as aulas.",
      avatarHue: 95,
    },
    {
      id: "s_andre",
      academyId: ACADEMY_ID,
      userId: "u_andre",
      name: "André Barbosa",
      email: "andre@aluno.origem",
      phone: "(19) 99612-8080",
      birthDate: "1993-03-28",
      division: "adult",
      belt: "brown",
      stripes: 0,
      joinDate: "2018-04-02",
      lastPromotionDate: "2025-10-11",
      status: "active",
      monthlyFee: 200,
      notes: "Competidor. Peso pena. Próximo estadual em outubro.",
      avatarHue: 25,
    },
    {
      id: "s_larissa",
      academyId: ACADEMY_ID,
      userId: "u_larissa",
      name: "Larissa Dias",
      email: "larissa@aluno.origem",
      phone: "(19) 98155-9090",
      birthDate: "2001-10-05",
      division: "adult",
      belt: "blue",
      stripes: 1,
      joinDate: "2024-11-19",
      lastPromotionDate: "2026-03-07",
      status: "trial",
      monthlyFee: 180,
      notes: "Última semana de aula experimental. Converter para mensalista.",
      avatarHue: 340,
    },
  ];

  const classes: ClassSession[] = [
    {
      id: "c_gi",
      academyId: ACADEMY_ID,
      name: "Adultos Gi",
      weekday: 1,
      startTime: "19:30",
      durationMin: 75,
      instructorId: "u_carla",
      division: "adult",
      gi: true,
      capacity: 28,
    },
    {
      id: "c_gi_w",
      academyId: ACADEMY_ID,
      name: "Adultos Gi",
      weekday: 3,
      startTime: "19:30",
      durationMin: 75,
      instructorId: "u_carla",
      division: "adult",
      gi: true,
      capacity: 28,
    },
    {
      id: "c_gi_f",
      academyId: ACADEMY_ID,
      name: "Adultos Gi",
      weekday: 5,
      startTime: "19:30",
      durationMin: 75,
      instructorId: "u_rafael",
      division: "adult",
      gi: true,
      capacity: 28,
    },
    {
      id: "c_kids_t",
      academyId: ACADEMY_ID,
      name: "Kids 7–12",
      weekday: 2,
      startTime: "18:00",
      durationMin: 50,
      instructorId: "u_rafael",
      division: "kids",
      gi: true,
      capacity: 16,
    },
    {
      id: "c_kids_th",
      academyId: ACADEMY_ID,
      name: "Kids 7–12",
      weekday: 4,
      startTime: "18:00",
      durationMin: 50,
      instructorId: "u_rafael",
      division: "kids",
      gi: true,
      capacity: 16,
    },
    {
      id: "c_nogi_t",
      academyId: ACADEMY_ID,
      name: "No-Gi",
      weekday: 2,
      startTime: "20:30",
      durationMin: 60,
      instructorId: "u_pedro",
      division: "adult",
      gi: false,
      capacity: 22,
    },
    {
      id: "c_nogi_th",
      academyId: ACADEMY_ID,
      name: "No-Gi",
      weekday: 4,
      startTime: "20:30",
      durationMin: 60,
      instructorId: "u_pedro",
      division: "adult",
      gi: false,
      capacity: 22,
    },
    {
      id: "c_comp",
      academyId: ACADEMY_ID,
      name: "Competição",
      weekday: 6,
      startTime: "10:00",
      durationMin: 90,
      instructorId: "u_carla",
      division: "adult",
      gi: true,
      capacity: 18,
    },
    {
      id: "c_women",
      academyId: ACADEMY_ID,
      name: "Turma feminina",
      weekday: 3,
      startTime: "18:30",
      durationMin: 60,
      instructorId: "u_carla",
      division: "adult",
      gi: true,
      capacity: 16,
    },
  ];

  const attendance: Attendance[] = [];
  const adultIds = [
    "s_joao",
    "s_ana",
    "s_marina",
    "s_thiago",
    "s_pedro",
    "s_andre",
    "s_larissa",
  ];
  const kidsIds = ["s_bia", "s_sofia"];
  const giClassByWeekday: Record<number, string> = {
    1: "c_gi",
    3: "c_gi_w",
    5: "c_gi_f",
  };

  for (const weeksAgo of [0, 1, 2, 3, 4, 5, 6]) {
    for (const weekday of [1, 3, 5]) {
      const date = dateOnWeekday(weekday, weeksAgo);
      if (date >= isoDate(0)) continue;
      for (const sid of adultIds) {
        if (sid === "s_larissa" && weeksAgo > 1) continue;
        if (sid === "s_ana" && weeksAgo === 2 && weekday === 5) continue;
        attendance.push({
          id: seedId("at"),
          academyId: ACADEMY_ID,
          studentId: sid,
          classId: giClassByWeekday[weekday],
          date,
          checkedInAt: `${date}T19:32:00.000Z`,
          method: weeksAgo === 0 ? "app" : "manual",
        });
      }
    }
    for (const weekday of [2, 4]) {
      const date = dateOnWeekday(weekday, weeksAgo);
      if (date >= isoDate(0)) continue;
      for (const sid of kidsIds) {
        attendance.push({
          id: seedId("at"),
          academyId: ACADEMY_ID,
          studentId: sid,
          classId: weekday === 2 ? "c_kids_t" : "c_kids_th",
          date,
          checkedInAt: `${date}T18:02:00.000Z`,
          method: "manual",
        });
      }
      if (weeksAgo < 4) {
        for (const sid of ["s_joao", "s_andre", "s_marina"]) {
          attendance.push({
            id: seedId("at"),
            academyId: ACADEMY_ID,
            studentId: sid,
            classId: weekday === 2 ? "c_nogi_t" : "c_nogi_th",
            date,
            checkedInAt: `${date}T20:31:00.000Z`,
            method: "app",
          });
        }
      }
    }
  }

  const camilaLast = dateOnWeekday(1, 4);
  attendance.push({
    id: seedId("at"),
    academyId: ACADEMY_ID,
    studentId: "s_camila",
    classId: "c_gi",
    date: camilaLast,
    checkedInAt: `${camilaLast}T19:40:00.000Z`,
    method: "manual",
    status: "validated",
  });

  const todayIso = isoDate(0);
  const todayAdult = classes.find(
    (c) => c.weekday === weekdayToday() && c.division === "adult",
  );
  const todayKids = classes.find(
    (c) => c.weekday === weekdayToday() && c.division === "kids",
  );
  if (todayAdult) {
    const now = new Date().toISOString();
    attendance.push(
      {
        id: seedId("at"),
        academyId: ACADEMY_ID,
        studentId: "s_ana",
        classId: todayAdult.id,
        date: todayIso,
        checkedInAt: now,
        method: "app",
        status: "pending",
      },
      {
        id: seedId("at"),
        academyId: ACADEMY_ID,
        studentId: "s_marina",
        classId: todayAdult.id,
        date: todayIso,
        checkedInAt: now,
        method: "app",
        status: "pending",
      },
      {
        id: seedId("at"),
        academyId: ACADEMY_ID,
        studentId: "s_thiago",
        classId: todayAdult.id,
        date: todayIso,
        checkedInAt: now,
        method: "manual",
        status: "validated",
        validatedAt: now,
        validatedBy: "u_carla",
      },
    );
  }
  if (todayKids) {
    attendance.push({
      id: seedId("at"),
      academyId: ACADEMY_ID,
      studentId: "s_bia",
      classId: todayKids.id,
      date: todayIso,
      checkedInAt: new Date().toISOString(),
      method: "app",
      status: "pending",
    });
  }

  const thisMonth = monthOffset(0);
  const lastMonth = monthOffset(-1);
  const payments: Payment[] = [];

  for (const s of students) {
    if (s.monthlyFee === 0) {
      payments.push({
        id: seedId("pay"),
        academyId: ACADEMY_ID,
        studentId: s.id,
        month: thisMonth,
        amount: 0,
        status: "waived",
      });
      continue;
    }
    if (s.status === "inactive") continue;
    if (s.id === "s_lucas" || s.id === "s_camila") {
      payments.push({
        id: seedId("pay"),
        academyId: ACADEMY_ID,
        studentId: s.id,
        month: thisMonth,
        amount: s.monthlyFee,
        status: "overdue",
      });
      if (s.id === "s_camila") {
        payments.push({
          id: seedId("pay"),
          academyId: ACADEMY_ID,
          studentId: s.id,
          month: lastMonth,
          amount: s.monthlyFee,
          status: "overdue",
        });
      }
      continue;
    }
    if (s.status === "trial") {
      payments.push({
        id: seedId("pay"),
        academyId: ACADEMY_ID,
        studentId: s.id,
        month: thisMonth,
        amount: s.monthlyFee,
        status: "pending",
      });
      continue;
    }
    payments.push({
      id: seedId("pay"),
      academyId: ACADEMY_ID,
      studentId: s.id,
      month: thisMonth,
      amount: s.monthlyFee,
      status: "paid",
      paidAt: `${thisMonth}-05T14:00:00.000Z`,
      method: "pix",
    });
    payments.push({
      id: seedId("pay"),
      academyId: ACADEMY_ID,
      studentId: s.id,
      month: lastMonth,
      amount: s.monthlyFee,
      status: "paid",
      paidAt: `${lastMonth}-04T11:00:00.000Z`,
      method: "pix",
    });
  }

  const expenses: Expense[] = [
    {
      id: seedId("ex"),
      academyId: ACADEMY_ID,
      description: "Aluguel do salão",
      category: "rent",
      amount: 4200,
      date: `${thisMonth}-05`,
    },
    {
      id: seedId("ex"),
      academyId: ACADEMY_ID,
      description: "Energia e água",
      category: "utilities",
      amount: 680,
      date: `${thisMonth}-08`,
    },
    {
      id: seedId("ex"),
      academyId: ACADEMY_ID,
      description: "Rafael Costa — aulas kids",
      category: "instructor",
      amount: 1800,
      date: `${thisMonth}-01`,
    },
    {
      id: seedId("ex"),
      academyId: ACADEMY_ID,
      description: "Reposição de faixas e patches",
      category: "supplies",
      amount: 340,
      date: `${thisMonth}-12`,
    },
  ];

  const inventory: InventoryItem[] = [
    {
      id: seedId("inv"),
      academyId: ACADEMY_ID,
      name: "Kimono Origem",
      sku: "KIM-A2",
      category: "kimono",
      size: "A2",
      quantity: 4,
      minQuantity: 3,
      cost: 220,
      price: 420,
    },
    {
      id: seedId("inv"),
      academyId: ACADEMY_ID,
      name: "Kimono Origem",
      sku: "KIM-A3",
      category: "kimono",
      size: "A3",
      quantity: 1,
      minQuantity: 3,
      cost: 230,
      price: 440,
    },
    {
      id: seedId("inv"),
      academyId: ACADEMY_ID,
      name: "Faixa azul",
      sku: "FX-AZ",
      category: "belt",
      quantity: 8,
      minQuantity: 4,
      cost: 28,
      price: 65,
    },
    {
      id: seedId("inv"),
      academyId: ACADEMY_ID,
      name: "Faixa branca",
      sku: "FX-BR",
      category: "belt",
      quantity: 2,
      minQuantity: 6,
      cost: 22,
      price: 45,
    },
    {
      id: seedId("inv"),
      academyId: ACADEMY_ID,
      name: "Rashguard preta",
      sku: "RG-P",
      category: "apparel",
      size: "M",
      quantity: 6,
      minQuantity: 3,
      cost: 55,
      price: 129,
    },
    {
      id: seedId("inv"),
      academyId: ACADEMY_ID,
      name: "Protetor bucal",
      sku: "PB-01",
      category: "gear",
      quantity: 11,
      minQuantity: 5,
      cost: 12,
      price: 35,
    },
  ];

  const graduations: Graduation[] = [
    {
      id: seedId("gr"),
      academyId: ACADEMY_ID,
      studentId: "s_joao",
      fromBelt: "white",
      toBelt: "blue",
      stripes: 0,
      date: "2024-09-14",
      notes: "Boa guarda fechada. Promovido no seminário de setembro.",
    },
    {
      id: seedId("gr"),
      academyId: ACADEMY_ID,
      studentId: "s_joao",
      fromBelt: "blue",
      toBelt: "blue",
      stripes: 2,
      date: "2025-11-20",
      notes: "Dois graus. Consistência nas terças de no-gi.",
    },
    {
      id: seedId("gr"),
      academyId: ACADEMY_ID,
      studentId: "s_marina",
      fromBelt: "white",
      toBelt: "blue",
      stripes: 0,
      date: "2023-02-11",
      notes: "Primeira faixa colorida.",
    },
    {
      id: seedId("gr"),
      academyId: ACADEMY_ID,
      studentId: "s_ana",
      fromBelt: "blue",
      toBelt: "purple",
      stripes: 0,
      date: "2023-11-25",
      notes: "Faixa roxa após estadual.",
    },
  ];

  const posts: Post[] = [
    {
      id: seedId("po"),
      academyId: ACADEMY_ID,
      authorId: "u_carla",
      authorName: "Carla Mendes",
      authorRole: "owner",
      content:
        "Seminário com o professor Marcos no dia 20. Vagas limitadas — confirmação no WhatsApp da academia. Kimono obrigatório.",
      pinned: true,
      createdAt: `${isoDate(-1)}T11:20:00.000Z`,
      likedBy: ["s_joao", "s_ana", "s_marina", "s_andre"],
    },
    {
      id: seedId("po"),
      academyId: ACADEMY_ID,
      authorId: "u_joao",
      authorName: "João Pedro Almeida",
      authorRole: "student",
      content:
        "Quem vai no estadual? Estou fechando carona saindo de Campinas sábado 6h.",
      createdAt: `${isoDate(-2)}T21:04:00.000Z`,
      likedBy: ["s_andre", "s_marina"],
    },
    {
      id: seedId("po"),
      academyId: ACADEMY_ID,
      authorId: "u_rafael",
      authorName: "Rafael Costa",
      authorRole: "instructor",
      content:
        "Kids: amanhã o treino começa 10 minutos mais cedo. Trazer faixa extra — vamos trabalhar troca de guarda.",
      createdAt: `${isoDate(-3)}T16:40:00.000Z`,
      likedBy: ["s_bia"],
    },
  ];

  const evaluations: Evaluation[] = [
    {
      id: "ev_marina",
      academyId: ACADEMY_ID,
      studentId: "s_marina",
      date: isoDate(-4),
      instructorName: "Carla Mendes",
      notes:
        "Passagem de guarda consistente. Pronto para faixa roxa no próximo seminário.",
      recommendPromotion: true,
    },
    {
      id: "ev_joao",
      academyId: ACADEMY_ID,
      studentId: "s_joao",
      date: isoDate(-10),
      instructorName: "Rafael Costa",
      notes: "Melhorou o jogo de costas. Manter frequência no no-gi.",
      recommendPromotion: false,
    },
  ];

  const rash = inventory.find((i) => i.sku === "RG-P");
  const events: AcademyEvent[] = [
    {
      id: "evt_seminario",
      academyId: ACADEMY_ID,
      title: "Seminário com professor Marcos",
      kind: "seminar",
      date: isoDate(14),
      time: "10:00",
      place: "Tatame principal",
      notes: "Kimono obrigatório. Vagas limitadas — confirma no app ou no Zap.",
      fee: 80,
      goingIds: ["s_joao", "s_marina", "s_andre"],
    },
    {
      id: "evt_estadual",
      academyId: ACADEMY_ID,
      title: "Estadual SP — equipe Origem",
      kind: "championship",
      date: isoDate(28),
      time: "08:00",
      place: "Ginásio do Ibirapuera",
      notes: "Carona saindo de Campinas sábado 6h. Inscrição pela academia.",
      fee: 120,
      goingIds: ["s_joao", "s_ana"],
    },
  ];

  const sales: Sale[] = rash
    ? [
        {
          id: "sale_joao_rg",
          academyId: ACADEMY_ID,
          studentId: "s_joao",
          itemId: rash.id,
          itemName: `${rash.name}${rash.size ? ` ${rash.size}` : ""}`,
          quantity: 1,
          amount: rash.price,
          date: isoDate(-3),
          method: "pix",
        },
      ]
    : [];

  if (rash) rash.quantity = Math.max(0, rash.quantity - 1);

  const giDate = dateOnWeekday(1, 0) <= isoDate(0) ? dateOnWeekday(1, 0) : dateOnWeekday(1, 1);
  const dropIns: DropIn[] = [
    {
      id: "di_caio",
      academyId: ACADEMY_ID,
      name: "Caio Mendes",
      phone: "(19) 98877-0101",
      classId: "c_gi",
      date: giDate,
      amount: 40,
      method: "pix",
    },
  ];

  return {
    version: 6,
    academy,
    users,
    students: students.map((s, i) => ({ ...s, cpf: sandboxCpf(i + 1) })),
    classes,
    attendance,
    payments,
    expenses,
    inventory,
    graduations,
    evaluations,
    posts,
    events,
    sales,
    dropIns,
    session,
  };
}

export const DEMO_ACCOUNTS = [
  {
    email: "carla@origem.jj",
    password: "demo",
    role: "owner" as const,
    label: "Dona da academia",
    hint: "Carla Mendes · faixa preta",
  },
  {
    email: "rafael@origem.jj",
    password: "demo",
    role: "instructor" as const,
    label: "Professor",
    hint: "Rafael Costa · kids e no-gi",
  },
  {
    email: "joao@aluno.origem",
    password: "demo",
    role: "student" as const,
    label: "Aluno no PWA",
    hint: "João Pedro · faixa azul",
  },
];
