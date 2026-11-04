import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Container } from "../container";
import { Grid } from "../grid";
import { Stack } from "./Stack";

describe("Layout primitives", () => {
  it("Container defaults to lg, renders the chosen element, and forwards attributes", () => {
    const { rerender } = render(<Container data-testid="c">x</Container>);
    expect(screen.getByTestId("c")).toHaveAttribute("data-size", "lg");
    rerender(
      <Container as="main" size="fluid" className="custom" id="page">
        x
      </Container>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("data-size", "fluid");
    expect(main).toHaveClass("prava-container", "custom");
    expect(main).toHaveAttribute("id", "page");
  });

  it("Stack exposes layout as data attributes and adds no wrapper around children", () => {
    render(
      <Stack
        data-testid="s"
        orientation="horizontal"
        gap={2}
        align="end"
        justify="between"
        wrap
      >
        <i>a</i>
        <i>b</i>
      </Stack>,
    );
    const stack = screen.getByTestId("s");
    expect(stack).toHaveAttribute("data-orientation", "horizontal");
    expect(stack).toHaveAttribute("data-gap", "2");
    expect(stack).toHaveAttribute("data-align", "end");
    expect(stack).toHaveAttribute("data-justify", "between");
    expect(stack).toHaveAttribute("data-wrap");
    expect(screen.getByText("a").parentElement).toBe(stack);
  });

  it("Stack keeps gap 0 and omits unset options", () => {
    render(<Stack data-testid="s" gap={0} />);
    const stack = screen.getByTestId("s");
    expect(stack).toHaveAttribute("data-gap", "0");
    expect(stack).toHaveAttribute("data-orientation", "vertical");
    expect(stack).not.toHaveAttribute("data-wrap");
  });

  it("Grid passes columns and width as CSS variables, and consumer style wins", () => {
    render(
      <Grid
        data-testid="g"
        as="ul"
        columns={3}
        minColumnWidth="12rem"
        style={{ color: "red" }}
      />,
    );
    const grid = screen.getByTestId("g");
    expect(grid.tagName).toBe("UL");
    expect(grid).toHaveAttribute("data-columns", "3");
    expect(grid.style.getPropertyValue("--prava-grid-columns")).toBe("3");
    expect(grid.style.getPropertyValue("--prava-grid-min")).toBe("12rem");
    expect(grid.style.color).toBe("red");
  });

  it("Grid leaves auto-fit in charge without columns", () => {
    render(<Grid data-testid="g" />);
    const grid = screen.getByTestId("g");
    expect(grid).not.toHaveAttribute("data-columns");
    expect(grid.style.getPropertyValue("--prava-grid-columns")).toBe("");
  });
});
