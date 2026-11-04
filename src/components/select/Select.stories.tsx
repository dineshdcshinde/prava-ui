import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { Card, CardContent, CardHeader } from "../card";
import { HookFormStory } from "../field/HookFormStory";
import { FormField } from "../form-field";
import { PravaProvider } from "../provider";
import { Select } from "./Select";

const icon = (path: string) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);
const crown = icon("M2.5 12.5h11M3 5l2.75 3L8 3.5 10.25 8 13 5l-1 5.5H4z");
const shield = icon("M8 2l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6V4z");
const person = icon(
  "M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 13.5c.5-2.5 2.5-3.5 5-3.5s4.5 1 5 3.5",
);
const eye = icon(
  "M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 9.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z",
);

const roles = [
  { value: "owner", label: "Owner", icon: crown },
  { value: "admin", label: "Admin", icon: shield },
  { value: "member", label: "Member", icon: person },
  { value: "guest", label: "Guest", icon: eye, disabled: true },
];
const described = [
  {
    value: "admin",
    label: "Admin",
    icon: shield,
    description: "Can invite and remove people.",
  },
  {
    value: "member",
    label: "Member",
    icon: person,
    description: "Can edit projects they join.",
  },
  {
    value: "viewer",
    label: "Viewer",
    icon: eye,
    description: "Can read and leave comments.",
  },
];
const countries = [
  {
    label: "Asia",
    options: [
      { value: "in", label: "India" },
      { value: "jp", label: "Japan" },
      { value: "sg", label: "Singapore" },
      { value: "vn", label: "Việt Nam" },
    ],
  },
  {
    label: "Europe",
    options: [
      { value: "de", label: "Germany" },
      { value: "fr", label: "France" },
      { value: "es", label: "España" },
    ],
  },
  {
    label: "South America",
    options: [
      { value: "br", label: "Brazil" },
      { value: "cl", label: "Chile" },
    ],
  },
];

const frame = { display: "grid", gap: "1rem", maxWidth: "24rem" };

const meta = {
  title: "Forms/Select",
  component: Select,
  tags: ["autodocs"],
  args: { label: "Role", placeholder: "Choose a role", options: roles },
  render: (args) => (
    <div style={frame}>
      <Select {...args} />
    </div>
  ),
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Rows can carry a second line. */
export const WithDescriptions: Story = {
  args: { options: described, defaultValue: "member" },
};

/** Pass `{ label, options }` entries for group headings. */
export const Groups: Story = {
  args: {
    label: "Country",
    placeholder: "Choose a country",
    options: countries,
  },
};

/** `multiple` shows removable chips and submits an array. Backspace removes the last chip. */
export const Multiple: Story = {
  args: {
    label: "Reviewers",
    placeholder: "Add reviewers",
    multiple: true,
    defaultValue: ["owner", "admin"],
  },
};

/** `searchable` filters by label, ignoring case and accents: try "espana" or "viet". */
export const Searchable: Story = {
  args: {
    label: "Country",
    placeholder: "Choose a country",
    options: countries,
    searchable: true,
  },
};

/** Options may carry your own fields. `renderOption` draws them, and `onValueChange` returns the whole option. */
export const CustomFields: Story = {
  render: () => (
    <div style={frame}>
      <Select
        label="Plan"
        placeholder="Choose a plan"
        options={[
          { value: "free", label: "Free", price: "$0" },
          { value: "pro", label: "Pro", price: "$12" },
          { value: "team", label: "Team", price: "$40" },
        ]}
        renderOption={(option) => (
          <span
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <span>{option.label}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {option.price}
            </span>
          </span>
        )}
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={frame}>
      <Select
        aria-label="Small"
        size="sm"
        options={roles}
        defaultValue="admin"
      />
      <Select aria-label="Medium" options={roles} defaultValue="admin" />
      <Select
        aria-label="Large"
        size="lg"
        options={roles}
        defaultValue="admin"
      />
      <Select
        aria-label="Invalid"
        placeholder="Choose a role"
        options={roles}
        error="Pick a role."
      />
      <Select
        label="With help text"
        placeholder="Choose a role"
        options={roles}
        description="Admins can invite people."
        required
      />
      <Select
        aria-label="Disabled"
        disabled
        options={roles}
        defaultValue="owner"
      />
    </div>
  ),
};

/** The popup isn't clipped by a Card's edges and flips above the field when there's no room below. */
export const InsideCard: Story = {
  render: () => (
    <Card style={{ maxWidth: "24rem" }}>
      <CardHeader>
        <h2>Invite someone</h2>
      </CardHeader>
      <CardContent>
        <FormField
          label="Role"
          required
          description="Admins can invite and remove people."
          control={<Select placeholder="Choose a role" options={described} />}
        />
      </CardContent>
    </Card>
  ),
};

/** Labels, headings, and built-in text all come translated from the app and `PravaProvider` `messages`. */
const longRoles = [
  { value: "owner", label: "Workspace owner" },
  { value: "admin", label: "Billing and compliance administrator" },
  { value: "manager", label: "Regional project manager" },
  { value: "editor", label: "Editor" },
  { value: "analyst", label: "Analyst" },
  { value: "support", label: "Customer support specialist" },
  { value: "contractor", label: "External contractor" },
  { value: "guest", label: "Guest" },
];
const placedSelect = (label: string, justify: string, align: string) => (
  <div
    key={label}
    style={{
      justifySelf: justify,
      alignSelf: align,
      width: "min(10rem, 100%)",
    }}
  >
    <Select label={label} placeholder="Open me" options={longRoles} />
  </div>
);
const edges = ["start", "center", "end"] as const;
const rowNames = { start: "Top", center: "Middle", end: "Bottom" };

/**
 * Open each field: the list picks its side from the space available, with no props. Below is the
 * default, above when below is too small, and it widens for long options without leaving the
 * screen. The framed short screen has no room above or below, so the list opens beside the field.
 */
export const AutoPlacement: Story = {
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, iframeHeight: 640 } },
  },
  render: (_args, { globals }) => {
    const short = new URLSearchParams(location.search).has("short");
    const cells = {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "0.5rem",
      padding: "1rem",
      boxSizing: "border-box",
    } as const;
    if (short)
      return (
        <div
          style={{
            ...cells,
            height: "100dvh",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {edges.map((edge) => placedSelect(`Short, ${edge}`, edge, "center"))}
        </div>
      );
    return (
      <div
        style={{
          display: "grid",
          gridTemplateRows: "minmax(0, 1fr) auto",
          height: "100dvh",
        }}
      >
        <div style={{ ...cells, gridTemplateRows: "repeat(3, 1fr)" }}>
          {edges.flatMap((row) =>
            edges.map((column) =>
              placedSelect(`${rowNames[row]} ${column}`, column, row),
            ),
          )}
        </div>
        <div style={{ padding: "0 1rem 1rem" }}>
          <p style={{ margin: "0 0 0.5rem" }}>
            A short screen: no room above or below, so the list opens beside the
            field.
          </p>
          <iframe
            title="Select on a short screen"
            src={`${location.pathname}?id=forms-select--auto-placement&viewMode=story&short=1&globals=theme:${globals.theme};direction:${globals.direction}`}
            style={{
              display: "block",
              width: "100%",
              height: "11rem",
              border: "1px solid var(--prava-color-border)",
              borderRadius: "var(--prava-radius-control)",
            }}
          />
        </div>
      </div>
    );
  },
};

/**
 * `placement` asks for a side. It's kept while that side leaves about three rows of room, or fits
 * when beside the field; otherwise automatic placement takes over, so the list stays usable.
 */
export const ForcedPlacement: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        minHeight: "100dvh",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      {(["top", "bottom", "start", "end"] as const).map((placement) => (
        <div key={placement} style={{ width: "min(10rem, 100%)" }}>
          <Select
            label={`Opens ${placement}`}
            placeholder="Open me"
            placement={placement}
            options={roles}
          />
        </div>
      ))}
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <PravaProvider
      direction="rtl"
      locale="ar"
      messages={{
        required: "مطلوب",
        search: "بحث",
        noResults: "لا توجد نتائج",
        removeOption: "إزالة {label}",
        selectedCount: "{count} محدد",
      }}
    >
      <div style={frame}>
        <Select
          label="الدور"
          placeholder="اختر دورًا"
          required
          searchable
          options={[
            {
              value: "admin",
              label: "مسؤول",
              icon: shield,
              description: "يمكنه دعوة الأشخاص.",
            },
            { value: "member", label: "عضو", icon: person },
          ]}
        />
        <Select
          label="المراجعون"
          multiple
          defaultValue={["admin", "member"]}
          options={[
            { value: "admin", label: "مسؤول" },
            { value: "member", label: "عضو" },
          ]}
        />
      </div>
    </PravaProvider>
  ),
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ role: "" }}>
      {({ register, formState: { errors } }) => (
        <Select
          label="Role"
          placeholder="Choose a role"
          options={roles}
          field={register("role", { required: "Pick a role." })}
          error={errors.role?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** `register` works with `multiple` too; default values and Reset update the chips. */
export const MultipleWithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ reviewers: ["owner", "admin"] }}>
      {({ register }) => (
        <Select
          label="Reviewers"
          multiple
          options={roles}
          field={register("reviewers")}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ reviewers: [] as string[] }}>
      {({ control }) => (
        <Controller
          name="reviewers"
          control={control}
          rules={{ required: "Add at least one reviewer." }}
          render={({ field, fieldState }) => (
            <Select
              label="Reviewers"
              placeholder="Add reviewers"
              multiple
              options={roles}
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
