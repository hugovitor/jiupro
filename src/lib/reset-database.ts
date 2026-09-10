import type { SupabaseClient } from "@supabase/supabase-js";
import { operatorEmails } from "@/lib/operator";

const TABLES = [
  "attendance",
  "payments",
  "sales",
  "drop_ins",
  "evaluations",
  "graduations",
  "posts",
  "events",
  "inventory",
  "expenses",
  "classes",
  "students",
  "profiles",
  "academies",
  "operator_leads",
] as const;

async function countRows(admin: SupabaseClient, table: string) {
  const { count, error } = await admin.from(table).select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

async function deleteAll(admin: SupabaseClient, table: string) {
  for (let i = 0; i < 40; i++) {
    const { data, error } = await admin.from(table).select("id").limit(500);
    if (error) {
      if (/does not exist|schema cache|42P01/i.test(error.message)) return;
      throw new Error(`${table}: ${error.message}`);
    }
    const ids = (data ?? []).map((row) => String(row.id)).filter(Boolean);
    if (!ids.length) return;
    const removed = await admin.from(table).delete().in("id", ids);
    if (removed.error) throw new Error(`${table}: ${removed.error.message}`);
    if (ids.length < 500) return;
  }
}

async function listUsers(admin: SupabaseClient) {
  const users: Array<{ id: string; email?: string }> = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    users.push(...(data.users ?? []).map((user) => ({ id: user.id, email: user.email })));
    if ((data.users ?? []).length < 200) break;
  }
  return users;
}

export async function resetProductDatabase(admin: SupabaseClient) {
  const keep = operatorEmails();
  const users = await listUsers(admin);
  const academiesBefore = await countRows(admin, "academies");
  const studentsBefore = await countRows(admin, "students");

  for (const table of TABLES) {
    await deleteAll(admin, table);
  }

  let removedUsers = 0;
  for (const user of users) {
    const email = (user.email ?? "").trim().toLowerCase();
    if (keep.has(email)) continue;
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(error.message);
    removedUsers += 1;
  }

  const leftoverAcademies = await countRows(admin, "academies");
  const leftoverStudents = await countRows(admin, "students");
  const leftoverUsers = (await listUsers(admin)).filter(
    (user) => !keep.has((user.email ?? "").trim().toLowerCase()),
  );

  return {
    academies: academiesBefore,
    students: studentsBefore,
    users: removedUsers,
    leftoverAcademies,
    leftoverStudents,
    leftoverUsers: leftoverUsers.length,
  };
}
