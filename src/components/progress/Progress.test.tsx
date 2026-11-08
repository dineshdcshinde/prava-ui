import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("clamps determinate values and exposes the range", () => {
    render(<Progress label="Upload" min={10} max={50} value={60} />);
    expect(screen.getByRole("progressbar", { name: "Upload" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    expect(screen.getByRole("progressbar")).toHaveStyle(
      "--prava-progress-value: 100%",
    );
  });

  it("omits the current value for indeterminate progress", () => {
    render(<Progress label="Saving" />);
    expect(
      screen.getByRole("progressbar", { name: "Saving" }),
    ).not.toHaveAttribute("aria-valuenow");
  });

  it.each([false, true])(
    "names the bar from an element label with showValue %s",
    (showValue) => {
      const Trans = () => <>Téléversement</>;
      render(<Progress label={<Trans />} value={5} showValue={showValue} />);
      expect(
        screen.getByRole("progressbar", { name: "Téléversement" }),
      ).not.toHaveAttribute("aria-label");
    },
  );

  it("rejects an invalid range", () => {
    expect(() =>
      render(<Progress label="Upload" min={4} max={4} value={2} />),
    ).toThrow(RangeError);
  });
});
