"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { studentAppInviteHref } from "@/lib/student-join";
import { useStore } from "@/lib/store";
import type { Student } from "@/lib/types";

export function SendStudentAccessButton({
  student,
  size = "sm",
  className,
}: {
  student: Pick<Student, "name" | "phone" | "email" | "userId">;
  size?: "sm" | "default";
  className?: string;
}) {
  const store = useStore();
  if (!student.phone.trim()) return null;
  return (
    <Button
      size={size}
      variant="outline"
      className={className}
      render={
        <a
          href={studentAppInviteHref(store.academy, student.phone, student)}
          target="_blank"
          rel="noreferrer"
        />
      }
    >
      <MessageCircle className="size-3.5" />
      {student.userId ? "Reenviar login" : "Mandar acesso"}
    </Button>
  );
}
