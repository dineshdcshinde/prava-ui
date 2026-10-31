import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Card, CardContent, CardFooter, CardHeader } from "./Card";

afterEach(cleanup);

describe("Card", () => {
  it("composes header, content, and footer without adding interactive semantics", () => {
    render(
      <Card>
        <CardHeader>
          <h2>Account</h2>
        </CardHeader>
        <CardContent>Profile details</CardContent>
        <CardFooter>
          <button type="button">Edit</button>
        </CardFooter>
      </Card>,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Account" }),
    ).toBeTruthy();
    expect(screen.getByText("Profile details")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /account/i })).toBeNull();
  });

  it("forwards native attributes and styling on each part", () => {
    render(
      <Card className="custom-card" data-testid="card" style={{ width: 320 }}>
        <CardHeader className="custom-header" data-testid="header">
          Header
        </CardHeader>
        <CardContent className="custom-content" data-testid="content">
          Content
        </CardContent>
        <CardFooter className="custom-footer" data-testid="footer">
          Footer
        </CardFooter>
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("custom-card");
    expect(screen.getByTestId("card").getAttribute("style")).toContain(
      "width: 320px",
    );
    expect(screen.getByTestId("header").className).toContain("custom-header");
    expect(screen.getByTestId("content").className).toContain("custom-content");
    expect(screen.getByTestId("footer").className).toContain("custom-footer");
  });
});
