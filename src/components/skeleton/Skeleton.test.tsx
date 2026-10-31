import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("is decorative and accepts dimensions and classes", () => {
    const { container } = render(
      <Skeleton
        shape="circle"
        className="avatar-placeholder"
        style={{ width: 40 }}
      />,
    );
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveClass("avatar-placeholder");
    expect(skeleton.style.width).toBe("40px");
    expect(skeleton.style.aspectRatio).toBe("1 / 1");
  });
});
