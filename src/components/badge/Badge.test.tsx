import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../button";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("anchors a non-interactive count to its child at the logical top-end by default", () => {
    render(
      <Badge size="sm" content="3">
        <Button>Inbox</Button>
      </Badge>,
    );
    const indicator = screen.getByText("3");
    expect(indicator).toHaveAttribute("data-tone", "danger");
    expect(indicator).toHaveAttribute("data-placement", "top-end");
    expect(indicator.closest("button")).toBeNull();
    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
  });

  it.each(["top-start", "top-end", "bottom-start", "bottom-end"] as const)(
    "places the indicator at %s",
    (placement) => {
      render(
        <Badge placement={placement} content="3">
          <Button>Inbox</Button>
        </Badge>,
      );
      expect(screen.getByText("3")).toHaveAttribute(
        "data-placement",
        placement,
      );
    },
  );

  it("renders a standalone neutral status label without a child", () => {
    render(<Badge content="Draft" className="custom" data-testid="b" />);
    expect(screen.getByTestId("b")).toHaveAttribute("data-standalone", "true");
    expect(screen.getByTestId("b")).toHaveClass("custom");
    expect(screen.getByText("Draft")).toHaveAttribute("data-tone", "neutral");
    expect(screen.getByText("Draft")).not.toHaveAttribute("data-placement");
  });
});
