import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "../label";
import { PravaProvider } from "./PravaProvider";

describe("PravaProvider", () => {
  it("uses ltr and English defaults outside a provider", () => {
    render(<Label required>Name</Label>);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("scopes direction, locale, and theme to its subtree without touching the document", () => {
    render(
      <PravaProvider direction="rtl" locale="ar" theme="dark">
        <span>inside</span>
      </PravaProvider>,
    );
    const root = screen.getByText("inside").parentElement!;
    expect(root).toHaveAttribute("dir", "rtl");
    expect(root).toHaveAttribute("lang", "ar");
    expect(root).toHaveAttribute("data-prava-theme", "dark");
    expect(document.documentElement).not.toHaveAttribute("dir", "rtl");
  });

  it("updates direction at runtime", () => {
    const { rerender } = render(
      <PravaProvider>
        <span>inside</span>
      </PravaProvider>,
    );
    expect(screen.getByText("inside").parentElement).toHaveAttribute(
      "dir",
      "ltr",
    );
    rerender(
      <PravaProvider direction="rtl">
        <span>inside</span>
      </PravaProvider>,
    );
    expect(screen.getByText("inside").parentElement).toHaveAttribute(
      "dir",
      "rtl",
    );
  });

  it("overrides built-in messages and merges nested providers", () => {
    render(
      <PravaProvider messages={{ required: "Obligatoire" }}>
        <Label required>Nom</Label>
        <PravaProvider direction="rtl" messages={{ loading: "Chargement" }}>
          <Label required>Inner</Label>
        </PravaProvider>
      </PravaProvider>,
    );
    expect(screen.getAllByText("Obligatoire")).toHaveLength(2);
  });
});
