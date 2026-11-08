import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties, type ReactElement } from "react";
import { Controller } from "react-hook-form";
import { Card, CardContent, CardHeader } from "../card";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { Calendar } from "./Calendar";
import { DatePicker, type DatePickerProps } from "./DatePicker";

const meta = {
  title: "Forms/DatePicker",
  component: DatePicker,
  args: { label: "Due date" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "24rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<DatePickerProps>;
export default meta;

type Story = StoryObj<DatePickerProps>;

const isWeekend = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  return weekday === 0 || weekday === 6;
};

export const Default: Story = {
  args: {
    description: "Type a date, or choose one from the calendar.",
    defaultValue: "2026-11-05",
  },
};

export const Range: Story = {
  args: {
    label: "Trip dates",
    mode: "range",
    defaultValue: ["2026-11-05", "2026-11-12"],
  },
};

export const Limits: Story = {
  args: {
    label: "Delivery day",
    defaultValue: "2026-11-10",
    min: "2026-11-02",
    max: "2026-12-18",
    isDateDisabled: isWeekend,
    description: "Weekdays only, up to 18 December.",
  },
};

export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <DatePicker label="Required" required name="required" />
      <DatePicker label="With an error" error="Choose a later date." />
      <DatePicker label="Disabled" disabled defaultValue="2026-11-05" />
      <DatePicker label="Read only" readOnly defaultValue="2026-11-05" />
    </div>
  ),
};

export const Controlled: Story = {
  render: function Render() {
    const [date, setDate] = useState("2026-02-28");
    return (
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <DatePicker label="Date" value={date} onValueChange={setDate} />
        <output>Value: {date || "none"}</output>
      </div>
    );
  },
};

export const InsideCard: Story = {
  render: () => (
    <Card style={{ overflow: "hidden" }}>
      <CardHeader>Schedule</CardHeader>
      <CardContent>
        <DatePicker label="Starts" defaultValue="2026-11-05" />
      </CardContent>
    </Card>
  ),
};

export const StandaloneCalendar: Story = {
  render: () => <Calendar defaultValue="2026-11-05" aria-label="Pick a day" />,
};

export const StandaloneRange: Story = {
  render: () => (
    <Calendar
      mode="range"
      defaultValue={["2026-11-05", "2026-11-12"]}
      aria-label="Pick days"
    />
  ),
};

export const LocaleFirstDay: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      <PravaProvider locale="en-US">
        <Calendar defaultValue="2026-11-05" aria-label="Starts on Sunday" />
      </PravaProvider>
      <PravaProvider locale="de">
        <Calendar defaultValue="2026-11-05" aria-label="Starts on Monday" />
      </PravaProvider>
    </div>
  ),
};

export const RTL: Story = {
  render: () => (
    <PravaProvider
      direction="rtl"
      locale="ar-EG"
      messages={{
        chooseDate: "اختر تاريخًا",
        changeDate: "غيّر التاريخ، {date}",
        previousMonth: "الشهر السابق",
        nextMonth: "الشهر التالي",
        previousYear: "السنة السابقة",
        nextYear: "السنة التالية",
      }}
    >
      <DatePicker label="تاريخ الاستحقاق" defaultValue="2026-11-05" />
    </PravaProvider>
  ),
};

export const Customized: Story = {
  args: {
    defaultValue: "2026-11-05",
    className: "date-picker-demo",
    style: { borderRadius: "1rem" },
  },
  decorators: [
    (Story: () => ReactElement) => (
      <div
        style={
          {
            "--prava-color-primary": "#0f766e",
            "--prava-color-on-primary": "#ffffff",
            "--prava-color-primary-container": "#ccfbf1",
            "--prava-color-on-primary-container": "#134e4a",
          } as CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};

export const WithReactHookForm: Story = {
  render: () => (
    <HookFormStory defaultValues={{ due: "2026-11-05" }}>
      {({ control }) => (
        <Controller
          name="due"
          control={control}
          rules={{ required: "Choose a date" }}
          render={({ field, fieldState }) => (
            <DatePicker
              label="Due date"
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
