import { createRef } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PravaProvider } from "../provider";
import { Breadcrumb } from "./Breadcrumb";

const items = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Archive" },
  { label: "Prava", href: "/projects/prava" },
  { label: "Settings" },
];
const trigger = () => screen.getByRole("button", { name: "Show hidden items" });
const current = () => screen.getByText("Settings").parentElement;
// The closed menu stays in the DOM, so read only each row's own label.
const rows = () =>
  screen
    .getAllByRole("listitem")
    .map(
      (li) => li.querySelector(".prava-breadcrumb__label")?.textContent ?? "",
    );

describe("Breadcrumb", () => {
  it("is a labelled nav holding an ordered list with the last item current", () => {
    render(<Breadcrumb items={items} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("Archive").closest("a")).toBeNull();
    expect(current()).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("marks a last item that is a link as current", () => {
    render(<Breadcrumb items={items.slice(0, 2)} />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("puts a decorative separator between items only", () => {
    const { container, rerender } = render(<Breadcrumb items={items} />);
    const separators = () =>
      container.querySelectorAll(".prava-breadcrumb__separator");
    expect(separators()).toHaveLength(4);
    separators().forEach((el) =>
      expect(el).toHaveAttribute("aria-hidden", "true"),
    );
    expect(
      screen
        .getByText("Settings")
        .closest("li")
        ?.querySelector(".prava-breadcrumb__separator"),
    ).toBeNull();
    rerender(<Breadcrumb items={items} separator="/" />);
    expect(separators()[0]).toHaveTextContent("/");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAccessibleName(
      "Home",
    );
  });

  it("hides item icons from assistive technology", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/", icon: <svg data-testid="i" /> }]}
      />,
    );
    expect(screen.getByTestId("i").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("does not collapse when the items fit", () => {
    render(<Breadcrumb items={items} maxItems={5} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("collapses the middle into a menu, keeping the first and last items", async () => {
    const user = userEvent.setup();
    render(<Breadcrumb items={items} maxItems={3} />);
    expect(rows()).toEqual(["Home", "", "Prava", "Settings"]);
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "Show hidden items" });
    const hidden = within(menu).getAllByRole("menuitem");
    expect(hidden.map((el) => el.textContent)).toEqual(["Projects", "Archive"]);
    expect(hidden[0]).toHaveAttribute("href", "/projects");
    expect(hidden[1]).toHaveAttribute("aria-disabled", "true");
  });

  it.each([
    [1, ["", "Settings"]],
    [0, ["", "Settings"]],
    [2, ["Home", "", "Settings"]],
  ])(
    "keeps the current page visible with maxItems=%i",
    (maxItems, expected) => {
      render(<Breadcrumb items={items} maxItems={maxItems} />);
      expect(rows()).toEqual(expected);
      expect(current()).toHaveAttribute("aria-current", "page");
    },
  );

  it("works from the keyboard and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Breadcrumb items={items} maxItems={3} />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
    await user.tab();
    expect(trigger()).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Projects" })).toHaveFocus(),
    );
    await user.keyboard("{Escape}");
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("uses provider messages, and aria-label wins over them", () => {
    const { rerender } = render(
      <PravaProvider
        locale="fr"
        messages={{
          breadcrumb: "Fil d'Ariane",
          showHiddenBreadcrumbs: "Afficher les éléments masqués",
        }}
      >
        <Breadcrumb items={items} maxItems={2} />
      </PravaProvider>,
    );
    expect(
      screen.getByRole("navigation", { name: "Fil d'Ariane" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Afficher les éléments masqués" }),
    ).toBeInTheDocument();
    rerender(<Breadcrumb items={items} aria-label="Docs path" />);
    expect(
      screen.getByRole("navigation", { name: "Docs path" }),
    ).toBeInTheDocument();
  });

  it("forwards ref, native attributes, className, style and slot classes", () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Breadcrumb
        ref={ref}
        items={items}
        maxItems={2}
        data-testid="root"
        className="custom"
        style={{ color: "inherit" }}
        classNames={{
          list: "l",
          item: "i",
          label: "t",
          separator: "s",
          trigger: "g",
        }}
      />,
    );
    const root = screen.getByTestId("root");
    expect(ref.current).toBe(root);
    expect(root).toHaveClass("prava-breadcrumb", "custom");
    expect(root.style.color).toBe("inherit");
    for (const name of ["l", "i", "t", "s", "g"])
      expect(container.querySelector(`.${name}`)).not.toBeNull();
  });

  it("renders an empty path without a menu", () => {
    render(<Breadcrumb items={[]} maxItems={2} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
