import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "../checkbox";
import { FormField } from "../form-field";
import { Input } from "../input";
import { RadioGroup } from "../radio-group";
import { Select } from "../select";
import { Switch } from "../switch";
import { Textarea } from "../textarea";

type Values = {
  email: string;
  bio: string;
  role: string;
  plan: string;
  terms: boolean;
  alerts: boolean;
  work: string;
};

const empty: Values = {
  email: "",
  bio: "",
  role: "",
  plan: "",
  terms: false,
  alerts: false,
  work: "",
};
const filled: Values = {
  email: "a@b.co",
  bio: "Hi",
  role: "admin",
  plan: "pro",
  terms: true,
  alerts: true,
  work: "w@b.co",
};
const plans = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
];
const roles = [{ value: "admin", label: "Admin" }];

type Form = ReturnType<typeof useForm<Values>>;

/** Renders every control from a binding, so register and Controller run the same assertions. */
const controls = (
  bind: (name: keyof Values) => object,
  error: (name: keyof Values) => string | undefined,
) => (
  <>
    <Input aria-label="Email" field={bind("email")} error={error("email")} />
    <Textarea aria-label="Bio" field={bind("bio")} error={error("bio")} />
    <Select
      aria-label="Role"
      placeholder="Choose"
      options={roles}
      field={bind("role")}
      error={error("role")}
    />
    <RadioGroup
      label="Plan"
      options={plans}
      field={bind("plan")}
      error={error("plan")}
    />
    <Checkbox label="Terms" field={bind("terms")} error={error("terms")} />
    <Switch label="Alerts" field={bind("alerts")} error={error("alerts")} />
    <FormField
      label="Work"
      error={error("work")}
      control={<Input field={bind("work")} />}
    />
  </>
);

const Shell = ({
  form,
  onSubmit,
  children,
}: {
  form: Form;
  onSubmit: (values: Values) => void;
  children: React.ReactNode;
}) => (
  <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
    {children}
    <button type="button" onClick={() => form.reset(filled)}>
      Reset
    </button>
    <button
      type="button"
      onClick={() => {
        for (const [name, value] of Object.entries(filled))
          form.setValue(name as keyof Values, value);
      }}
    >
      Set
    </button>
    <button type="submit">Save</button>
  </form>
);

const message = (name: string) => `${name} is required`;

function WithRegister({ onSubmit }: { onSubmit: (v: Values) => void }) {
  const form = useForm<Values>({ defaultValues: empty });
  return (
    <Shell form={form} onSubmit={onSubmit}>
      {controls(
        (name) => form.register(name, { required: message(name) }),
        (name) => form.formState.errors[name]?.message,
      )}
    </Shell>
  );
}

function WithController({ onSubmit }: { onSubmit: (v: Values) => void }) {
  const form = useForm<Values>({ defaultValues: empty });
  const fields = (Object.keys(empty) as (keyof Values)[]).map((name) => (
    <Controller
      key={name}
      name={name}
      control={form.control}
      rules={{ required: message(name) }}
      render={({ field, fieldState }) =>
        // Render one control per Controller; the helper picks it by name.
        pick(
          controls(
            () => field,
            () => fieldState.error?.message,
          ),
          name,
        )
      }
    />
  ));
  return (
    <Shell form={form} onSubmit={onSubmit}>
      {fields}
    </Shell>
  );
}

const order: (keyof Values)[] = [
  "email",
  "bio",
  "role",
  "plan",
  "terms",
  "alerts",
  "work",
];
const pick = (tree: React.ReactElement, name: keyof Values) =>
  (tree.props as { children: React.ReactElement[] }).children[
    order.indexOf(name)
  ]!;

const get = {
  email: () => screen.getByRole("textbox", { name: "Email" }),
  bio: () => screen.getByRole("textbox", { name: "Bio" }),
  role: () => screen.getByRole("combobox", { name: "Role" }),
  pro: () => screen.getByRole("radio", { name: "Pro" }),
  terms: () => screen.getByRole("checkbox", { name: "Terms" }),
  alerts: () => screen.getByRole("switch", { name: "Alerts" }),
  work: () => screen.getByRole("textbox", { name: "Work" }),
};

const expectFilled = () => {
  expect(get.email()).toHaveValue(filled.email);
  expect(get.bio()).toHaveValue(filled.bio);
  expect(get.role()).toHaveTextContent("Admin");
  expect(get.pro()).toBeChecked();
  expect(get.terms()).toBeChecked();
  expect(get.alerts()).toBeChecked();
  expect(get.work()).toHaveValue(filled.work);
};

describe.each([
  ["register", WithRegister],
  ["Controller", WithController],
] as const)("field prop with %s", (_, Form) => {
  it("shows every error, focuses the first control, and clears them when fixed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    for (const name of order)
      expect(await screen.findByText(message(name))).toBeInTheDocument();
    expect(get.email()).toHaveFocus();
    expect(get.email()).toHaveAttribute("aria-invalid", "true");
    expect(get.terms()).toHaveAccessibleDescription(message("terms"));
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(get.email(), "dev@prava.dev");
    await user.type(get.bio(), "Hello");
    await user.click(get.role());
    await user.click(screen.getByRole("option", { name: "Admin" }));
    await user.click(get.pro());
    await user.click(get.terms());
    await user.click(get.alerts());
    await user.type(get.work(), "w@prava.dev");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({
        email: "dev@prava.dev",
        bio: "Hello",
        role: "admin",
        plan: "pro",
        terms: true,
        alerts: true,
        work: "w@prava.dev",
      }),
    );
    expect(screen.queryByText(message("email"))).toBeNull();
  });

  it("follows reset() on every control", async () => {
    const user = userEvent.setup();
    render(<Form onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(expectFilled);
  });

  it("follows setValue() on every control", async () => {
    const user = userEvent.setup();
    render(<Form onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Set" }));
    await waitFor(expectFilled);
  });
});

describe("field prop", () => {
  it("runs the control's own handlers and forwarded ref alongside the binding", async () => {
    const user = userEvent.setup();
    const own = { onChange: vi.fn(), onBlur: vi.fn() };
    const bound = { onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() };
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Name" ref={ref} {...own} field={bound} />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(ref.current).toBe(input);
    expect(bound.ref).toHaveBeenCalledWith(input);
    await user.type(input, "a");
    await user.tab();
    for (const handler of [
      own.onChange,
      own.onBlur,
      bound.onChange,
      bound.onBlur,
    ])
      expect(handler).toHaveBeenCalledTimes(1);
  });

  it("lets explicit props win over the binding", () => {
    render(
      <Input
        aria-label="Name"
        name="own"
        field={{ name: "bound", disabled: true }}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).toHaveAttribute("name", "own");
    expect(input).toBeDisabled();
  });
});
