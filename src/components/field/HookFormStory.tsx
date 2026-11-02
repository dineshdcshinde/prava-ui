import { useState, type ReactNode } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { Button } from "../button";

type HookFormStoryProps<T extends FieldValues> = {
  defaultValues: DefaultValues<T>;
  children: (form: UseFormReturn<T>) => ReactNode;
};

/** Storybook-only form shell: a submit button and the submitted values, so stories show the round trip. */
export function HookFormStory<T extends FieldValues>({
  defaultValues,
  children,
}: HookFormStoryProps<T>) {
  const form = useForm<T>({ defaultValues });
  const [submitted, setSubmitted] = useState<T>();
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(setSubmitted)}
      style={{ display: "grid", gap: "1rem", maxWidth: "28rem" }}
    >
      {children(form)}
      <div style={{ display: "flex", gap: ".5rem" }}>
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost" onClick={() => form.reset()}>
          Reset
        </Button>
      </div>
      {submitted && <output>Submitted: {JSON.stringify(submitted)}</output>}
    </form>
  );
}
