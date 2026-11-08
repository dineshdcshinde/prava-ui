import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties } from "react";
import { Button } from "../button";
import { PravaProvider } from "../provider/PravaProvider";
import { FileUpload } from "./FileUpload";

const meta = {
  title: "Forms/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  args: { label: "Attachments", multiple: true },
  argTypes: {
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
    accept: { control: "text" },
    maxSize: { control: "number" },
    maxFiles: { control: "number" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(100%, 28rem)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { description: "Your files stay on this device until you send them." },
};

export const SingleFile: Story = {
  args: { label: "Profile photo", multiple: false, accept: "image/*" },
};

export const Limits: Story = {
  args: {
    accept: "image/*,.pdf",
    maxSize: 1024 * 1024,
    maxFiles: 2,
    description: "Images or PDFs, up to 1 MB each, 2 files at most.",
  },
};

export const WithError: Story = {
  args: { error: "Attach your signed contract." },
};

export const Disabled: Story = {
  args: { disabled: true },
};

const longName =
  "quarterly-financial-statement-and-auditor-commentary-final-reviewed-version-2026.pdf";
const sample = [
  new File(["x".repeat(2048)], longName, { type: "application/pdf" }),
  new File(["x".repeat(1536)], "notes.txt", { type: "text/plain" }),
];

export const LongFileNames: Story = {
  render: (args) => {
    const [files, setFiles] = useState(sample);
    return <FileUpload {...args} value={files} onFilesChange={setFiles} />;
  },
};

export const InNativeForm: Story = {
  render: (args) => {
    const [sent, setSent] = useState<string>();
    return (
      <form
        style={{ display: "grid", gap: "1rem", justifyItems: "start" }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSent(
            data
              .getAll("attachments")
              .map((entry) => (entry as File).name)
              .join(", "),
          );
        }}
      >
        <FileUpload
          {...args}
          name="attachments"
          accept=".txt"
          required
          style={{ justifySelf: "stretch" }}
        />
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Button type="submit">Send</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
        {sent !== undefined && <output>Sent: {sent}</output>}
      </form>
    );
  },
};

export const RTL: Story = {
  render: () => (
    <PravaProvider
      direction="rtl"
      locale="ar"
      messages={{
        chooseFiles: "اختر الملفات",
        dropFiles: "أو أفلتها هنا",
        removeFile: "إزالة {label}",
        fileTooLarge: "{label} أكبر من {max}.",
        fileTypeRejected: "{label} ليس نوع ملف مقبولًا.",
        selectedCount: "{count} محدد",
      }}
    >
      <FileUpload label="المرفقات" multiple maxSize={1024} accept=".txt" />
    </PravaProvider>
  ),
};

export const Customized: Story = {
  args: {
    className: "story-file-upload",
    style: {
      "--prava-color-surface-sunken": "var(--prava-color-primary-container)",
      "--prava-radius-control": "1rem",
    } as CSSProperties,
  },
};
