import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider";
import { Pagination } from "./Pagination";

const items = () => [...screen.getByRole("navigation").querySelectorAll("li")];

/** The list as a wide container shows it: compact-only gaps and the arrows left out. */
const wideLayout = () =>
  items()
    .filter((li) => !li.hasAttribute("data-compact-only"))
    .map((li) => li.textContent)
    .filter(Boolean)
    .join(" ");

const pageButton = (page: number) =>
  screen.getByRole("button", { name: `Go to page ${page}` });

describe("Pagination", () => {
  it("names the nav, marks the current page and forwards root props", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Pagination
        ref={ref}
        pageCount={5}
        defaultPage={2}
        className="mine"
        style={{ opacity: 0.5 }}
        data-testid="root"
        classNames={{ link: "my-link", list: "my-list", item: "my-item" }}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(ref.current).toBe(nav);
    expect(nav).toHaveClass("prava-pagination", "mine");
    expect(nav).toHaveAttribute("data-testid", "root");
    expect(nav).toHaveStyle({ opacity: "0.5" });
    expect(nav.querySelector("ul")).toHaveClass("my-list");
    expect(items()[0]).toHaveClass("my-item");
    expect(pageButton(2)).toHaveAttribute("aria-current", "page");
    expect(pageButton(2)).toHaveClass("my-link");
    expect(pageButton(3)).not.toHaveAttribute("aria-current");
  });

  it("lets aria-label override the localized name", () => {
    render(<Pagination pageCount={5} aria-label="Results pages" />);
    expect(
      screen.getByRole("navigation", { name: "Results pages" }),
    ).toBeInTheDocument();
  });

  it.each([
    [1, 1, "1 2 3 4 5 … 20"],
    [4, 1, "1 2 3 4 5 … 20"],
    [5, 1, "1 … 4 5 6 … 20"],
    [16, 1, "1 … 15 16 17 … 20"],
    [17, 1, "1 … 16 17 18 19 20"],
    [20, 1, "1 … 16 17 18 19 20"],
    [10, 0, "1 … 10 … 20"],
    [1, 0, "1 2 3 … 20"],
    [10, 2, "1 … 8 9 10 11 12 … 20"],
  ])(
    "lays out page %i with siblingCount %i as %s",
    (page, siblingCount, text) => {
      render(
        <Pagination
          pageCount={20}
          defaultPage={page}
          siblingCount={siblingCount}
        />,
      );
      expect(wideLayout()).toBe(text);
    },
  );

  it("shows every page when they all fit the slots", () => {
    render(<Pagination pageCount={7} defaultPage={4} />);
    expect(wideLayout()).toBe("1 2 3 4 5 6 7");
  });

  it("adds compact-only gaps where hiding siblings would open a jump", () => {
    render(<Pagination pageCount={5} defaultPage={3} />);
    const summary = items()
      .slice(1, -1)
      .map((li) =>
        [
          li.textContent,
          li.hasAttribute("data-sibling") && "sibling",
          li.hasAttribute("data-edge") && "edge",
          li.hasAttribute("data-compact-only") && "compact",
        ]
          .filter(Boolean)
          .join(":"),
      );
    expect(summary).toEqual([
      "1:edge",
      "…:edge:compact",
      "2:sibling",
      "3",
      "4:sibling",
      "…:edge:compact",
      "5:edge",
    ]);
  });

  it("hides gaps from assistive technology and shows them in wide layouts when pages are skipped", () => {
    render(<Pagination pageCount={20} defaultPage={10} />);
    const gaps = items().filter((li) => li.textContent === "…");
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) {
      expect(gap).toHaveAttribute("aria-hidden", "true");
      expect(gap).not.toHaveAttribute("data-compact-only");
    }
  });

  it("moves uncontrolled with clicks and reports each change", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await userEvent.click(pageButton(4));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    expect(pageButton(4)).toHaveAttribute("aria-current", "page");
    await userEvent.click(
      screen.getByRole("button", { name: "Previous page" }),
    );
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it("does not report a click on the current page", async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination pageCount={5} defaultPage={2} onPageChange={onPageChange} />,
    );
    await userEvent.click(pageButton(2));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("follows the page prop when controlled", async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination pageCount={5} page={2} onPageChange={onPageChange} />,
    );
    await userEvent.click(pageButton(3));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(pageButton(2)).toHaveAttribute("aria-current", "page");
    rerender(<Pagination pageCount={5} page={3} onPageChange={onPageChange} />);
    expect(pageButton(3)).toHaveAttribute("aria-current", "page");
  });

  it("works with state a parent owns", async () => {
    function Parent() {
      const [page, setPage] = useState(1);
      return <Pagination pageCount={3} page={page} onPageChange={setPage} />;
    }
    render(<Parent />);
    await userEvent.click(pageButton(3));
    expect(pageButton(3)).toHaveAttribute("aria-current", "page");
  });

  it("works from the keyboard and keeps focus on an arrow that reaches the end", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination pageCount={3} defaultPage={2} onPageChange={onPageChange} />,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Previous page" })).toHaveFocus();
    await user.tab();
    expect(pageButton(1)).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(pageButton(1)).toHaveFocus();

    const next = screen.getByRole("button", { name: "Next page" });
    next.focus();
    await user.keyboard(" ");
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await user.keyboard("{Enter}");
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(next).toHaveFocus();
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).toBeEnabled();
    await user.keyboard("{Enter}");
    expect(onPageChange).toHaveBeenCalledTimes(3);
  });

  it.each([
    [100, 5],
    [0, 1],
    [-3, 1],
    [2.7, 2],
    [Number.NaN, 1],
  ])("clamps page %s to %i of 5", (page, shown) => {
    render(<Pagination pageCount={5} page={page} />);
    expect(pageButton(shown)).toHaveAttribute("aria-current", "page");
  });

  it("clamps when pageCount shrinks and moves on from the clamped page", async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination pageCount={10} defaultPage={8} onPageChange={onPageChange} />,
    );
    rerender(
      <Pagination pageCount={3} defaultPage={8} onPageChange={onPageChange} />,
    );
    expect(pageButton(3)).toHaveAttribute("aria-current", "page");
    expect(onPageChange).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "Previous page" }),
    );
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "renders nothing for pageCount %s",
    (pageCount) => {
      const { container } = render(<Pagination pageCount={pageCount} />);
      expect(container).toBeEmptyDOMElement();
    },
  );

  it("treats a single page as current with both arrows disabled", async () => {
    const onPageChange = vi.fn();
    render(<Pagination pageCount={1} onPageChange={onPageChange} />);
    expect(pageButton(1)).toHaveAttribute("aria-current", "page");
    expect(items()).toHaveLength(3);
    for (const name of ["Previous page", "Next page"]) {
      const arrow = screen.getByRole("button", { name });
      expect(arrow).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(arrow);
    }
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("shows two pages with no gaps", () => {
    render(<Pagination pageCount={2} />);
    expect(items().map((li) => li.textContent)).toEqual(["", "1", "2", ""]);
  });

  it("treats a negative siblingCount as zero", () => {
    render(<Pagination pageCount={20} defaultPage={10} siblingCount={-2} />);
    expect(wideLayout()).toBe("1 … 10 … 20");
  });

  describe("getHref", () => {
    it("renders real links, with no href on an unavailable arrow", () => {
      render(<Pagination pageCount={3} getHref={(p) => `/posts?page=${p}`} />);
      expect(screen.queryByRole("button")).toBeNull();
      const current = screen.getByRole("link", { name: "Go to page 1" });
      expect(current).toHaveAttribute("href", "/posts?page=1");
      expect(current).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
        "href",
        "/posts?page=2",
      );
      const previous = screen.getByRole("link", { name: "Previous page" });
      expect(previous).not.toHaveAttribute("href");
      expect(previous).toHaveAttribute("aria-disabled", "true");
      expect(previous).toHaveAttribute("tabindex", "0");
    });

    it("updates on a plain click but not on one that opens elsewhere", async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <Pagination
          pageCount={3}
          getHref={(p) => `#${p}`}
          onPageChange={onPageChange}
        />,
      );
      const link = screen.getByRole("link", { name: "Go to page 2" });
      await user.keyboard("{Control>}");
      await user.click(link);
      await user.keyboard("{/Control}");
      expect(onPageChange).not.toHaveBeenCalled();
      await user.click(link);
      expect(onPageChange).toHaveBeenCalledWith(2);
      expect(link).toHaveAttribute("aria-current", "page");
    });
  });

  it("uses the provider's locale and messages", () => {
    render(
      <PravaProvider
        direction="rtl"
        locale="ar-EG"
        messages={{
          pagination: "الصفحات",
          previousPage: "السابق",
          nextPage: "التالي",
          goToPage: "الصفحة {page}",
        }}
      >
        <Pagination pageCount={3} defaultPage={2} />
      </PravaProvider>,
    );
    expect(
      screen.getByRole("navigation", { name: "الصفحات" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "السابق" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التالي" })).toBeInTheDocument();
    const current = screen.getByRole("button", { name: "الصفحة ٢" });
    expect(current).toHaveTextContent("٢");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("groups large numbers for the locale", () => {
    render(
      <PravaProvider locale="de">
        <Pagination pageCount={2000} defaultPage={1000} />
      </PravaProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Go to page 1.000" }),
    ).toHaveTextContent("1.000");
  });
});
