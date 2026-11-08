import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { Combobox } from "./Combobox";

const cities = [
  { value: "pune", label: "Pune" },
  { value: "patna", label: "Patna" },
  { value: "sao-paulo", label: "São Paulo" },
  { value: "seoul", label: "Seoul" },
  { value: "lisbon", label: "Lisbon" },
  { value: "leh", label: "Leh", disabled: true },
  { value: "oslo", label: "Oslo" },
  { value: "osaka", label: "Osaka" },
];
const grouped = [
  {
    label: "Asia",
    options: [
      { value: "pune", label: "Pune", description: "Maharashtra, India" },
      { value: "osaka", label: "Osaka", description: "Kansai, Japan" },
    ],
  },
  {
    label: "Europe",
    options: [
      { value: "lisbon", label: "Lisbon", description: "Portugal" },
      { value: "oslo", label: "Oslo", description: "Norway" },
    ],
  },
];

const frame = { display: "grid", gap: "1rem", maxWidth: "24rem" };

const meta = {
  title: "Forms/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  args: { label: "City", placeholder: "Search cities", options: cities },
  render: (args) => (
    <div style={frame}>
      <Combobox {...args} />
    </div>
  ),
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Group headings and a second line on each row. */
export const Groups: Story = { args: { options: grouped } };

/** Chips stay in the field; the list stays open so several can be picked in a row. */
export const Multiple: Story = {
  args: {
    label: "Cities",
    multiple: true,
    defaultValue: ["pune", "oslo"],
  },
};

/** Enter, or leaving the field, keeps text that matches no option. */
export const AllowCustomValue: Story = {
  args: {
    label: "City or town",
    placeholder: "Type any place",
    allowCustomValue: true,
  },
};

/** Multiple with custom values works as a tag entry. */
export const MultipleCustomValues: Story = {
  args: {
    label: "Tags",
    placeholder: "Add a tag",
    multiple: true,
    allowCustomValue: true,
    options: cities.slice(0, 3),
  },
};

const fakeServer = (query: string) =>
  new Promise<typeof cities>((resolve) => {
    const needle = query.trim().toLowerCase();
    setTimeout(
      () => resolve(cities.filter((c) => c.value.includes(needle))),
      600,
    );
  });

/** Pass results as `options` with `filter={false}`, and `loading` while a request runs. A later response replaces an earlier one. */
export const AsyncServerResults: Story = {
  render: function Render() {
    const [text, setText] = useState("");
    const [results, setResults] = useState<typeof cities>([]);
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState("");
    useEffect(() => {
      let current = true;
      setLoading(true);
      void fakeServer(text).then((next) => {
        if (!current) return;
        setResults(next);
        setLoading(false);
      });
      return () => {
        current = false;
      };
    }, [text]);
    return (
      <div style={frame}>
        <Combobox
          label="City"
          placeholder="Search the server"
          filter={false}
          loading={loading}
          options={results}
          value={value}
          onValueChange={(next) => setValue(next)}
          inputValue={text}
          onInputValueChange={setText}
        />
        <output>Value: {value || "none"}</output>
      </div>
    );
  },
};

export const States: Story = {
  render: () => (
    <div style={frame}>
      <Combobox
        label="With help"
        description="We use this for shipping."
        options={cities}
      />
      <Combobox
        label="With error"
        error="Choose a city from the list."
        defaultValue="pune"
        options={cities}
      />
      <Combobox label="Required" required options={cities} />
      <Combobox
        label="Disabled"
        disabled
        defaultValue="pune"
        options={cities}
      />
      <Combobox
        label="Disabled chips"
        disabled
        multiple
        defaultValue={["pune", "oslo"]}
        options={cities}
      />
      <Combobox
        label="Read only"
        readOnly
        defaultValue="pune"
        options={cities}
      />
      <Combobox label="Small" size="sm" options={cities} />
      <Combobox label="Large" size="lg" options={cities} />
    </div>
  ),
};

const arabic = [
  { value: "cairo", label: "القاهرة", description: "مصر" },
  { value: "dubai", label: "دبي", description: "الإمارات" },
  { value: "amman", label: "عمّان", description: "الأردن" },
];

export const RTL: Story = {
  render: () => (
    <PravaProvider
      direction="rtl"
      locale="ar"
      messages={{
        required: "مطلوب",
        noResults: "لا توجد نتائج",
        loading: "جارٍ التحميل",
        removeOption: "إزالة {label}",
        selectedCount: "{count} محدد",
        resultCount: "{count} نتيجة",
      }}
    >
      <div style={frame}>
        <Combobox
          label="المدينة"
          placeholder="ابحث عن مدينة"
          required
          options={arabic}
        />
        <Combobox
          label="المدن"
          multiple
          defaultValue={["cairo", "dubai"]}
          options={arabic}
        />
      </div>
    </PravaProvider>
  ),
};

/** `className` and `style` reach the field, `classNames` the inner slots, and tokens restyle it all. */
export const Customized: Story = {
  args: {
    className: "story-combobox",
    style: {
      "--prava-color-focus": "var(--prava-color-success)",
      "--prava-radius-control": "0.25rem",
    } as React.CSSProperties,
    classNames: { popup: "story-combobox-popup" },
  },
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ city: "" }}>
      {({ register, formState: { errors } }) => (
        <Combobox
          label="City"
          placeholder="Search cities"
          options={cities}
          field={register("city", { required: "Pick a city." })}
          error={errors.city?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ cities: [] as string[] }}>
      {({ control }) => (
        <Controller
          name="cities"
          control={control}
          rules={{ required: "Add at least one city." }}
          render={({ field, fieldState }) => (
            <Combobox
              label="Cities"
              placeholder="Add cities"
              multiple
              options={cities}
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};

/** A plain form: the real submission carries `name`, including each chip and custom value. */
export const NativeForm: Story = {
  render: function Render() {
    const [sent, setSent] = useState("");
    return (
      <form
        style={frame}
        onSubmit={(event) => {
          event.preventDefault();
          setSent(
            JSON.stringify([...new FormData(event.currentTarget).entries()]),
          );
        }}
      >
        <Combobox label="City" name="city" options={cities} allowCustomValue />
        <Combobox label="Cities" name="cities" multiple options={cities} />
        <button type="submit">Send</button>
        <button type="reset">Reset</button>
        <output>{sent}</output>
      </form>
    );
  },
};
