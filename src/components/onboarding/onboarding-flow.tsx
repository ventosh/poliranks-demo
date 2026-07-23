"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3;

const STEPS = ["פרטים", "אימות טלפון", "פרופיל (רשות)", "סיום"];

function StepDots({ step }: { step: Step }) {
  return (
    <ol className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "num flex size-7 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                i < step && "border-up bg-up/15 text-up",
                i === step && "border-primary bg-primary text-primary-foreground",
                i > step && "border-border text-muted-foreground"
              )}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span
              className={cn(
                "mx-2 mb-5 h-px w-10 sm:w-16",
                i < step ? "bg-up" : "bg-border"
              )}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

const PREFER_NOT = "מעדיף לא לומר";

function OptionalSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Select dir="rtl" value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={PREFER_NOT} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PREFER_NOT}>{PREFER_NOT}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function OnboardingFlow() {
  const [step, setStep] = React.useState<Step>(0);
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState<string[]>(Array(6).fill(""));
  const [otpFilling, setOtpFilling] = React.useState(false);

  // Demo magic: the OTP types itself
  React.useEffect(() => {
    if (step !== 1) return;
    setOtpFilling(true);
    const code = "482916";
    const timers: ReturnType<typeof setTimeout>[] = [];
    code.split("").forEach((d, i) => {
      timers.push(
        setTimeout(() => {
          setOtp((prev) => {
            const next = [...prev];
            next[i] = d;
            return next;
          });
          if (i === 5) setOtpFilling(false);
        }, 900 + i * 220)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const otpDone = otp.every((d) => d !== "");

  return (
    <div className="mx-auto w-full max-w-lg py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold font-heading">הצטרפות ל-PoliRanks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          דקה אחת — והקול שלך נספר במדד
        </p>
      </div>

      <StepDots step={step} />

      <div className="rounded-xl border border-border bg-card p-5">
        {step === 0 && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(1);
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs">
                אימייל <span className="text-muted-foreground">(ליצירת קשר בלבד — לא לאימות)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  dir="ltr"
                  placeholder="name@example.com"
                  className="pr-10 text-start"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-xs">
                טלפון נייד <span className="text-muted-foreground">(ערוץ האימות היחיד — SMS)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="050-1234567"
                  className="pr-10 text-start"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="mt-2 w-full font-bold">
              שליחת קוד אימות
            </Button>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              כל חבר רשום מאומת-טלפון. הזהות שלך מופרדת מהדעות שלך ברמת מסד הנתונים — איש אינו יכול לקשר ביניהן.
            </p>
          </form>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm">
              שלחנו קוד בן 6 ספרות אל{" "}
              <bdi className="num font-semibold">{phone || "050-1234567"}</bdi>
            </p>
            <div className="flex gap-2" dir="ltr">
              {otp.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    "num flex h-12 w-10 items-center justify-center rounded-lg border text-lg font-bold transition-all",
                    d
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background"
                  )}
                >
                  {d}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {otpFilling ? "מדמה קבלת SMS..." : "הקוד התקבל (הדגמה)"}
            </p>
            <Button
              disabled={!otpDone}
              onClick={() => setStep(2)}
              className="w-full font-bold"
            >
              אימות והמשך
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-accent/60 p-3 text-xs leading-relaxed">
              <UserRound className="size-4 shrink-0 text-muted-foreground" />
              <span>
                כל השדות — רשות. הם משמשים אך ורק לשקלול מצרפי (מוצג בכל גרף), נשמרים
                בנפרד מהצבעות, וניתנים למחיקה בכל רגע.
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionalSelect
                label="שנת לידה"
                options={["לפני 1960", "1960–1979", "1980–1994", "1995–2008"]}
                value={PREFER_NOT}
                onChange={() => {}}
              />
              <OptionalSelect
                label="עיר מגורים"
                options={["ירושלים", "תל אביב", "חיפה", "באר שבע", "אחר"]}
                value={PREFER_NOT}
                onChange={() => {}}
              />
              <OptionalSelect
                label="נטייה פוליטית (מדווח עצמית)"
                options={["ימין", "מרכז", "שמאל"]}
                value={PREFER_NOT}
                onChange={() => {}}
              />
              <OptionalSelect
                label="רמת דתיות"
                options={["חילוני", "מסורתי", "דתי", "חרדי"]}
                value={PREFER_NOT}
                onChange={() => {}}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(3)} className="flex-1 font-bold">
                שמירה והמשך
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep(3)}
                className="text-muted-foreground"
              >
                דילוג
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-up/15">
              <BadgeCheck className="size-8 text-up" />
            </span>
            <div>
              <h2 className="text-lg font-bold">ברוך הבא, אזרח חדש</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                החשבון מאומת. ההצבעה הראשונה שלך שווה 10 נקודות.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-up/30 bg-up/10 px-3 py-1 text-xs font-semibold text-up">
              <ShieldCheck className="size-3.5" />
              חבר רשום · מאומת טלפון · משקל הצבעה 1.0
            </span>
            <div className="mt-2 flex w-full gap-2">
              <Button asChild className="flex-1 font-bold">
                <Link href="/">לשאלות החמות</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard">לדשבורד שלי</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        הדגמה בלבד — לא נשלח SMS ולא נשמרים פרטים אישיים.
      </p>
    </div>
  );
}
