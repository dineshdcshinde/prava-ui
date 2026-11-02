import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  name: string;
};

const defaults: Values = {
  email: "",
  bio: "Hi",
  role: "",
  plan: "free",
  terms: false,
  alerts: true,
  name: "",
};

function Profile({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const { register, control, handleSubmit, reset, formState } = useForm<Values>(
    { defaultValues: defaults },
  );
  const { errors } = formState;
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Work email"
        error={errors.email?.message}
        {...register("email", { required: "Email is required" })}
      />
      <FormField label="Bio" control={<Textarea {...register("bio")} />} />
      <Select
        aria-label="Role"
        placeholder="Choose a role"
        error={errors.role?.message}
        options={[
          { value: "admin", label: "Admin" },
          { value: "member", label: "Member" },
        ]}
        {...register("role", { required: "Pick a role" })}
      />
      <RadioGroup
        label="Plan"
        options={[
          { value: "free", label: "Free" },
          { value: "pro", label: "Pro" },
        ]}
        {...register("plan")}
      />
      <Checkbox
        label="Accept terms"
        error={errors.terms?.message}
        {...register("terms", { required: "Accept the terms" })}
      />
      <Switch label="Alerts" {...register("alerts")} />
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <FormField label="Name" control={<Input {...field} />} />
        )}
      />
      <button
        type="button"
        onClick={() =>
          reset({ ...defaults, email: "a@b.co", plan: "pro", name: "Ada" })
        }
      >
        Reset
      </button>
      <button type="submit">Save</button>
    </form>
  );
}

describe("react-hook-form", () => {
  it("registers every control, shows errors, submits values, and resets through refs", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Profile onSubmit={onSubmit} />);
    const email = screen.getByRole("textbox", { name: "Work email" });
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveValue("Hi");
    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Alerts" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Pick a role")).toBeInTheDocument();
    expect(screen.getByText("Accept the terms")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(email, "dev@prava.dev");
    await user.click(screen.getByRole("combobox", { name: "Role" }));
    await user.click(screen.getByRole("option", { name: "Member" }));
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    await user.click(screen.getByRole("checkbox", { name: "Accept terms" }));
    await user.click(screen.getByRole("switch", { name: "Alerts" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Lin");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({
        email: "dev@prava.dev",
        bio: "Hi",
        role: "member",
        plan: "pro",
        terms: true,
        alerts: false,
        name: "Lin",
      }),
    );
    expect(screen.queryByText("Email is required")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(email).toHaveValue("a@b.co");
    expect(email.matches(":placeholder-shown")).toBe(false); // floating label follows ref-set values
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Ada");
  });
});
