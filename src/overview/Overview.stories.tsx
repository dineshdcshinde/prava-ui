import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  FormField,
  Input,
  PravaProvider,
  Progress,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  Switch,
  Textarea,
} from "../index";
import type { PravaProviderProps } from "../components/provider";

const copy = {
  en: {
    title: "Workspace settings",
    lede: "Manage your profile, plan, and notifications.",
    profile: "Profile",
    profileHint: "Shown to people in your workspace.",
    name: "Full name",
    email: "Work email",
    emailHint: "Used for sign-in and receipts.",
    role: "Role",
    choose: "Choose a role",
    bio: "About you",
    plan: "Plan",
    free: "Free",
    pro: "Pro, $12 per seat",
    enterprise: "Enterprise",
    notify: "Notifications",
    digest: "Weekly digest",
    digestHint: "A summary of activity every Monday.",
    mentions: "Mentions",
    terms: "I agree to the data processing terms",
    save: "Save changes",
    cancel: "Cancel",
    team: "Team",
    storage: "Storage used",
    active: "Active",
    pending: "Invited",
    loading: "Loading activity",
    required: "Enter your work email.",
  },
  ar: {
    title: "إعدادات مساحة العمل",
    lede: "أدر ملفك الشخصي وخطتك وإشعاراتك.",
    profile: "الملف الشخصي",
    profileHint: "يظهر للأشخاص في مساحة العمل.",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني للعمل",
    emailHint: "يُستخدم لتسجيل الدخول والإيصالات.",
    role: "الدور",
    choose: "اختر دورًا",
    bio: "نبذة عنك",
    plan: "الخطة",
    free: "مجانية",
    pro: "احترافية، ١٢ دولارًا للمقعد",
    enterprise: "مؤسسات",
    notify: "الإشعارات",
    digest: "ملخص أسبوعي",
    digestHint: "ملخص النشاط كل يوم اثنين.",
    mentions: "الإشارات",
    terms: "أوافق على شروط معالجة البيانات",
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    team: "الفريق",
    storage: "المساحة المستخدمة",
    active: "نشط",
    pending: "مدعو",
    loading: "جارٍ تحميل النشاط",
    required: "أدخل بريد العمل.",
  },
};

function Settings({ t }: { t: (typeof copy)["en"] }) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: { name: "Lina Haddad", email: "", role: "", bio: "" },
  });
  const { errors } = formState;
  return (
    <div
      style={{
        background: "var(--prava-color-canvas)",
        color: "var(--prava-color-text)",
        padding: "clamp(1rem, 4vw, 2.5rem)",
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
        alignItems: "start",
      }}
    >
      <header style={{ gridColumn: "1 / -1" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>
          {t.title}
        </h1>
        <p
          style={{
            margin: ".25rem 0 0",
            color: "var(--prava-color-text-muted)",
          }}
        >
          {t.lede}
        </p>
      </header>

      <form
        noValidate
        onSubmit={handleSubmit(() => {})}
        style={{ display: "contents" }}
      >
        <Card style={{ gridColumn: "1 / -1" }}>
          <CardHeader>
            <h2>{t.profile}</h2>
            <p>{t.profileHint}</p>
          </CardHeader>
          <CardContent
            style={{
              display: "grid",
              gap: "1.25rem",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
            }}
          >
            <FormField
              label={t.name}
              control={<Input {...register("name")} />}
            />
            <FormField
              label={t.email}
              required
              description={t.emailHint}
              error={errors.email?.message}
              control={
                <Input
                  type="email"
                  {...register("email", { required: t.required })}
                />
              }
            />
            <FormField
              label={t.role}
              control={
                <Select
                  placeholder={t.choose}
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "member", label: "Member" },
                  ]}
                  field={register("role")}
                />
              }
            />
            <FormField
              label={t.bio}
              control={<Textarea rows={3} {...register("bio")} />}
            />
            <RadioGroup
              label={t.plan}
              defaultValue="pro"
              options={[
                { value: "free", label: t.free },
                { value: "pro", label: t.pro },
                { value: "enterprise", label: t.enterprise, disabled: true },
              ]}
            />
            <div
              style={{ display: "grid", gap: "1rem", alignContent: "start" }}
            >
              <Switch
                label={t.digest}
                description={t.digestHint}
                defaultChecked
              />
              <Switch label={t.mentions} />
              <Checkbox label={t.terms} />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" type="button">
              {t.cancel}
            </Button>
            <Button type="submit">{t.save}</Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <h2>{t.team}</h2>
        </CardHeader>
        <CardContent style={{ display: "grid", gap: ".875rem" }}>
          {[
            ["Lina", "Haddad", t.active, "success"],
            ["Arjun", "Mehta", t.active, "success"],
            ["Sofia", "Reyes", t.pending, "warning"],
          ].map(([first, last, status, tone]) => (
            <div
              key={first}
              style={{ display: "flex", alignItems: "center", gap: ".75rem" }}
            >
              <Avatar firstName={first} lastName={last} size="sm" />
              <span style={{ flex: 1, minWidth: 0 }}>
                {first} {last}
              </span>
              <Badge content={status} tone={tone as "success" | "warning"} />
            </div>
          ))}
          <Separator />
          <Progress label={t.storage} value={64} showValue />
        </CardContent>
      </Card>

      <Card aria-busy="true" aria-label={t.loading}>
        <CardContent style={{ display: "grid", gap: ".75rem" }}>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
            <Skeleton shape="circle" />
            <div style={{ flex: 1 }}>
              <Skeleton shape="text" style={{ width: "60%" }} />
              <Skeleton shape="text" style={{ width: "40%" }} />
            </div>
          </div>
          <Skeleton style={{ height: "5rem" }} />
          <Progress label={t.loading} />
        </CardContent>
      </Card>
    </div>
  );
}

const meta = {
  title: "Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const frame = (props: Omit<PravaProviderProps, "children">, t = copy.en) => (
  <PravaProvider {...props}>
    <Settings t={t} />
  </PravaProvider>
);

/** A real settings screen built only from Prava components with default styling. */
export const Light: Story = { render: () => frame({ theme: "light" }) };
export const Dark: Story = { render: () => frame({ theme: "dark" }) };
export const RTL: Story = {
  render: () =>
    frame(
      { direction: "rtl", locale: "ar", messages: { required: "مطلوب" } },
      copy.ar,
    ),
};
