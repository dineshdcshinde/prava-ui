import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./Label";

describe("Label", () => {
  it("associates through htmlFor and shows required text only when requested", () => {
    const { rerender } = render(
      <>
        <Label htmlFor="name">Name</Label>
        <input id="name" />
      </>,
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(screen.queryByText("Required")).toBeNull();
    rerender(
      <>
        <Label htmlFor="name" required>
          Name
        </Label>
        <input id="name" />
      </>,
    );
    expect(
      screen.getByRole("textbox", { name: "Name Required" }),
    ).toBeInTheDocument();
  });
});
