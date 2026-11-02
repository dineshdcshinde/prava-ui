import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider";
import { Select } from "./Select";

const options = [
  { value: "owner", label: "Owner", plan: "pro" },
  { value: "admin", label: "Admin", description: "Can invite", plan: "free" },
  { value: "guest", label: "Guest", disabled: true, plan: "free" },
  { value: "viewer", label: "Viewer", plan: "free" },
];
const combo = (name = "Role") =>
  screen.getByRole("combobox", { name, hidden: false });

describe("Select", () => {
  it("shows the placeholder, opens on click, selects, closes, and refocuses", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        label="Role"
        placeholder="Choose"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    expect(combo()).toHaveTextContent("Choose");
    expect(combo()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("option")).toBeNull();

    await user.click(combo());
    expect(combo()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { name: "Role" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /Admin/ }));

    expect(combo()).toHaveTextContent("Admin");
    expect(combo()).toHaveAttribute("aria-expanded", "false");
    expect(combo()).toHaveFocus();
    // Extra fields come back on the option, typed.
    expect(onValueChange.mock.calls[0]?.[0]).toBe("admin");
    expect(onValueChange.mock.calls[0]?.[1].plan).toBe("free");
  });

  it("follows the keyboard pattern and skips disabled options", async () => {
    const user = userEvent.setup();
    render(<Select label="Role" options={options} defaultValue="admin" />);
    await user.tab();
    expect(combo()).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    const active = () =>
      document.getElementById(combo().getAttribute("aria-activedescendant")!);
    expect(active()).toHaveTextContent("Admin");
    await user.keyboard("{ArrowDown}");
    expect(active()).toHaveTextContent("Viewer"); // Guest is disabled
    await user.keyboard("{Home}");
    expect(active()).toHaveTextContent("Owner");
    await user.keyboard("{End}");
    expect(active()).toHaveTextContent("Viewer");
    await user.keyboard("o");
    expect(active()).toHaveTextContent("Owner");

    await user.keyboard("{Escape}");
    expect(combo()).toHaveAttribute("aria-expanded", "false");
    expect(combo()).toHaveTextContent("Admin");

    await user.keyboard(" ");
    expect(combo()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{End}{Enter}");
    expect(combo()).toHaveTextContent("Viewer");
    expect(combo()).toHaveAttribute("aria-expanded", "false");
  });

  it("does not choose disabled options by click", async () => {
    const user = userEvent.setup();
    render(<Select label="Role" options={options} placeholder="Choose" />);
    await user.click(combo());
    await user.click(screen.getByRole("option", { name: "Guest" }));
    expect(combo()).toHaveTextContent("Choose");
  });

  it("renders groups, descriptions, and custom rows", async () => {
    const user = userEvent.setup();
    render(
      <Select
        label="Role"
        options={[{ label: "Team", options: options.slice(0, 2) }]}
        renderOption={(option) => <b>{option.plan}</b>}
      />,
    );
    await user.click(combo());
    const group = screen.getByRole("group", { name: "Team" });
    expect(within(group).getAllByRole("option")).toHaveLength(2);
    expect(within(group).getByText("pro")).toBeInTheDocument();
  });

  it("supports multiple with chips, keyboard, and an array value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        label="Role"
        multiple
        options={options}
        defaultValue={["owner"]}
        onValueChange={onValueChange}
      />,
    );
    expect(combo()).toHaveTextContent("1 selected");
    await user.click(combo());
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    await user.click(screen.getByRole("option", { name: /Admin/ }));
    expect(combo()).toHaveAttribute("aria-expanded", "true"); // stays open
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["owner", "admin"],
      [options[0], options[1]],
    );

    await user.click(screen.getByRole("button", { name: "Remove Owner" }));
    expect(onValueChange.mock.lastCall?.[0]).toEqual(["admin"]);

    await user.keyboard("{Escape}{Backspace}");
    expect(onValueChange.mock.lastCall?.[0]).toEqual([]);
  });

  it("filters by search ignoring case and accents, with translated built-in text", async () => {
    const user = userEvent.setup();
    render(
      <PravaProvider
        locale="fr"
        messages={{ search: "Chercher", noResults: "Aucun résultat" }}
      >
        <Select
          label="Pays"
          searchable
          options={[
            { value: "es", label: "España" },
            { value: "node", label: <i>France</i>, searchText: "France" },
          ]}
        />
      </PravaProvider>,
    );
    await user.click(combo("Pays"));
    const search = screen.getByRole("combobox", { name: "Chercher" });
    expect(search).toHaveFocus();

    await user.type(search, "ESPANA");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(combo("Pays")).toHaveTextContent("España");

    await user.click(combo("Pays"));
    const again = screen.getByRole("combobox", { name: "Chercher" });
    expect(again).toHaveValue(""); // cleared on close
    await user.type(again, "france");
    expect(screen.getByRole("option", { name: "France" })).toBeInTheDocument();
    await user.clear(again);
    await user.type(again, "zzz");
    expect(screen.getByRole("status")).toHaveTextContent("Aucun résultat");
  });

  it("shows localized native validation on submit and focuses the trigger", async () => {
    render(
      <form>
        <Select label="Role" required options={options} />
        <button type="submit">Save</button>
      </form>,
    );
    screen.getByRole("button", { name: "Save" }).click();
    expect(await screen.findByText("Select an option.")).toBeInTheDocument();
    const role = screen.getByRole("combobox");
    expect(role).toHaveFocus();
    expect(role).toHaveAttribute("aria-invalid", "true");
  });

  it("submits through the hidden native control in form data", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Select label="Role" name="role" options={options} />
      </form>,
    );
    await user.click(combo());
    await user.click(screen.getByRole("option", { name: "Viewer" }));
    expect(
      new FormData(screen.getByTestId<HTMLFormElement>("form")).get("role"),
    ).toBe("viewer");
  });

  it("stays controlled when value is passed", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Select label="Role" options={options} value="owner" />,
    );
    await user.click(combo());
    await user.click(screen.getByRole("option", { name: /Admin/ }));
    expect(combo()).toHaveTextContent("Owner");
    rerender(<Select label="Role" options={options} value="admin" />);
    expect(combo()).toHaveTextContent("Admin");
  });

  it("works with register for multiple, including reset and setValue", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    function Form() {
      // jsdom options lack defaultSelected, so register skips defaults; tests/e2e/select.spec.ts covers them.
      const form = useForm({ defaultValues: { roles: [] as string[] } });
      return (
        <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <Select
            label="Role"
            multiple
            options={options}
            field={form.register("roles")}
          />
          <button
            type="button"
            onClick={() => form.setValue("roles", ["viewer"])}
          >
            Set
          </button>
          <button
            type="button"
            onClick={() => form.reset({ roles: ["admin"] })}
          >
            Reset
          </button>
          <button type="submit">Save</button>
        </form>
      );
    }
    render(<Form />);
    await user.click(screen.getByRole("button", { name: "Set" }));
    expect(
      screen.getByRole("button", { name: "Remove Viewer" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Remove Admin" }),
      ).toBeInTheDocument(),
    );
    // Submitting reads selectedOptions, which jsdom caches stale; the e2e spec covers it.
  });

  it("works with Controller for multiple", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    function Form() {
      const form = useForm({ defaultValues: { roles: [] as string[] } });
      return (
        <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            name="roles"
            control={form.control}
            render={({ field }) => (
              <Select label="Role" multiple options={options} field={field} />
            )}
          />
          <button type="submit">Save</button>
        </form>
      );
    }
    render(<Form />);
    await user.click(combo());
    await user.click(screen.getByRole("option", { name: /Admin/ }));
    await user.click(screen.getByRole("option", { name: "Viewer" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({
        roles: ["admin", "viewer"],
      }),
    );
  });

  it("marks touched through a real blur event for react-hook-form", async () => {
    const user = userEvent.setup();
    let touched = false;
    function Form() {
      const form = useForm({ defaultValues: { role: "" }, mode: "onTouched" });
      touched = Boolean(form.formState.touchedFields.role);
      return (
        <form noValidate>
          <Select
            label="Role"
            options={options}
            field={form.register("role", { required: "Pick one" })}
            error={form.formState.errors.role?.message}
          />
          <button type="button">Next</button>
        </form>
      );
    }
    render(<Form />);
    await user.click(combo());
    await user.keyboard("{Escape}");
    await user.tab();
    expect(await screen.findByText("Pick one")).toBeInTheDocument();
    expect(touched).toBe(true);
  });
});
