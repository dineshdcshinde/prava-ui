import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../components/badge";
import { Button } from "../components/button";

const colorTokens = [
  "canvas",
  "surface",
  "surface-sunken",
  "surface-hover",
  "surface-raised",
  "border",
  "border-strong",
  "text",
  "text-muted",
  "primary",
  "primary-hover",
  "primary-active",
  "on-primary",
  "primary-container",
  "on-primary-container",
  "focus",
  "success",
  "on-success",
  "warning",
  "on-warning",
  "danger",
  "danger-hover",
  "on-danger",
  "danger-container",
  "on-danger-container",
  "info",
  "on-info",
];
const badgeTones = ["primary", "success", "warning", "danger", "info"] as const;

function ThemePreview({ theme }: { theme: "light" | "dark" }) {
  return (
    <section
      data-prava-theme={theme}
      aria-label={`${theme} theme preview`}
      style={{
        display: "grid",
        gap: "1.5rem",
        padding: "1.5rem",
        color: "var(--prava-color-text)",
        background: "var(--prava-color-canvas)",
        border: "1px solid var(--prava-color-border)",
        borderRadius: "var(--prava-radius-card)",
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>
          {theme === "light" ? "Light" : "Dark"} theme
        </h2>
        <p style={{ color: "var(--prava-color-text-muted)" }}>
          Every component reads only these tokens. A theme replaces them all.
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.75rem",
          paddingBlock: ".5rem",
        }}
      >
        {badgeTones.map((tone) => (
          <Badge key={tone} tone={tone} content={tone}>
            <span
              style={{
                padding: ".5rem",
                background: "var(--prava-color-surface)",
                borderRadius: "var(--prava-radius-control)",
              }}
            >
              Inbox
            </span>
          </Badge>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(8.5rem, 1fr))",
          gap: ".5rem",
        }}
      >
        {colorTokens.map((token) => (
          <div
            key={token}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              minWidth: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                flex: "0 0 1.25rem",
                height: "1.25rem",
                background: `var(--prava-color-${token})`,
                border: "1px solid var(--prava-color-border)",
                borderRadius: ".25rem",
              }}
            />
            <code style={{ overflowWrap: "anywhere", fontSize: ".75rem" }}>
              {token}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}

function FoundationsPage() {
  return (
    <main
      style={{
        display: "grid",
        gap: "1.5rem",
        padding: "1.5rem",
        fontFamily: "inherit",
      }}
    >
      <header>
        <h1>Prava UI foundations</h1>
        <p>
          Cobalt Porcelain: glazed cool surfaces with cobalt for action and
          selection. Use the toolbar to switch theme and direction on any story.
        </p>
      </header>
      <section
        aria-labelledby="design-context-heading"
        style={{ maxWidth: "72rem" }}
      >
        <h2 id="design-context-heading">
          A familiar system with its own point of view
        </h2>
        <p>
          Prava borrows useful principles from three references while keeping
          its own tokens, components, and visual decisions.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))",
            gap: "1.25rem",
          }}
        >
          <div>
            <h3>Material · predictable and adaptive</h3>
            <p>
              Consistent tokens and states make controls easier to recognize
              across sizes and contexts.
            </p>
          </div>
          <div>
            <h3>Apple HIG · clear and purposeful</h3>
            <p>
              Hierarchy and spacing help people understand what matters; motion
              stays restrained and useful.
            </p>
          </div>
          <div>
            <h3>Geist · precise and information-rich</h3>
            <p>
              Readable type and compact feedback make detailed interfaces feel
              composed rather than crowded.
            </p>
          </div>
        </div>
        <h3>Prava’s six principles</h3>
        <p>
          Clarity before decoration · Adaptive by default · Delight without
          distraction · Customizable by design · Accessible for everyone ·
          Lightweight by default.
        </p>
        <p>
          Designed for broad audiences: readable at a glance, predictable to
          operate, comfortable across devices, and finished with brief feedback
          that respects reduced-motion settings.
        </p>
      </section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 32rem), 1fr))",
          gap: "1rem",
        }}
      >
        <ThemePreview theme="light" />
        <ThemePreview theme="dark" />
      </div>
    </main>
  );
}

const meta = {
  title: "Foundations/Overview",
  component: FoundationsPage,
} satisfies Meta<typeof FoundationsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
