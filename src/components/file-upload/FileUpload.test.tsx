import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "../form-field";
import { PravaProvider } from "../provider/PravaProvider";
import { FileUpload, type FileUploadProps } from "./index";

const file = (name: string, type = "", size = 1) =>
  new File(["x".repeat(size)], name, { type });

const pickerOf = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>(".prava-file-upload__input")!;
const namedOf = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>(
    'input[type="file"]:not(.prava-file-upload__input)',
  )!;
const names = (input: HTMLInputElement) =>
  Array.from(input.files ?? []).map((f) => f.name);
const removeButton = (name: string) =>
  screen.getByRole("button", { name: `Remove ${name}` });

const drop = (
  container: HTMLElement,
  files: File[],
  items: unknown[] = [],
  types = ["Files"],
) =>
  fireEvent.drop(container.querySelector(".prava-file-upload__dropzone")!, {
    dataTransfer: { files, items, types },
  });

const setup = (props: FileUploadProps = {}) => {
  const onFilesChange = vi.fn();
  const onReject = vi.fn();
  const view = render(
    <FileUpload
      label="Attachments"
      onFilesChange={onFilesChange}
      onReject={onReject}
      {...props}
    />,
  );
  return {
    ...view,
    onFilesChange,
    onReject,
    user: userEvent.setup({ applyAccept: false }),
  };
};

describe("FileUpload", () => {
  it("opens the real file input from a keyboard-reachable named button", async () => {
    const { container, user } = setup();
    const click = vi.spyOn(pickerOf(container), "click");
    await user.tab();
    const button = screen.getByRole("button", {
      name: /Attachments.*Choose files/,
    });
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(click).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(click).toHaveBeenCalledTimes(2);
    expect(pickerOf(container).type).toBe("file");
  });

  it("lists a chosen file with a locale-formatted size", async () => {
    const { container, user, onFilesChange } = setup();
    const chosen = file("a.txt", "text/plain", 2048);
    await user.upload(pickerOf(container), chosen);
    expect(onFilesChange).toHaveBeenCalledWith([chosen]);
    expect(screen.getByRole("listitem")).toHaveTextContent("a.txt");
    expect(screen.getByRole("listitem")).toHaveTextContent(
      new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte" }).format(
        2,
      ),
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 selected");
  });

  it("matches extensions, MIME types and wildcards from accept, ignoring case", async () => {
    const { container, user, onReject, onFilesChange } = setup({
      multiple: true,
      accept: "image/*, .PDF, text/plain",
    });
    const good = [
      file("a.png", "image/png"),
      file("B.pdf"),
      file("c.txt", "TEXT/PLAIN;charset=utf-8"),
    ];
    const bad = [
      file("d.zip", "application/zip"),
      file("imagery"),
      file("pdf"),
    ];
    await user.upload(pickerOf(container), [...good, ...bad]);
    expect(onFilesChange).toHaveBeenLastCalledWith(good);
    expect(onReject.mock.calls).toEqual(bad.map((f) => [f, "type"]));
  });

  it("treats a missing, blank or */* accept as anything", async () => {
    for (const accept of [undefined, " , ", "*/*"]) {
      const { container, user, onReject, unmount } = setup({ accept });
      await user.upload(pickerOf(container), file("a.bin"));
      expect(onReject).not.toHaveBeenCalled();
      unmount();
    }
  });

  it("rejects over maxSize but accepts exactly maxSize, with the limit in the provider's locale", async () => {
    const onReject = vi.fn();
    const { container } = render(
      <PravaProvider locale="de">
        <FileUpload multiple maxSize={1536} onReject={onReject} />
      </PravaProvider>,
    );
    const exact = file("exact.txt", "", 1536);
    const big = file("big.txt", "", 1537);
    await userEvent.upload(pickerOf(container), [exact, big]);
    expect(onReject.mock.calls).toEqual([[big, "size"]]);
    expect(names(namedOf(container))).toEqual(["exact.txt"]);
    const max = new Intl.NumberFormat("de", {
      style: "unit",
      unit: "kilobyte",
      maximumFractionDigits: 1,
    }).format(1.5);
    expect(max).toContain("1,5");
    expect(screen.getByRole("alert")).toHaveTextContent(
      `big.txt is larger than ${max}.`,
    );
  });

  it("enforces maxFiles across choices and announces it once for many extra files", async () => {
    const { container, user, onReject, onFilesChange } = setup({
      multiple: true,
      maxFiles: 2,
    });
    await user.upload(pickerOf(container), file("1.txt"));
    await user.upload(pickerOf(container), [
      file("2.txt"),
      file("3.txt"),
      file("4.txt"),
    ]);
    expect(names(namedOf(container))).toEqual(["1.txt", "2.txt"]);
    expect(onFilesChange).toHaveBeenCalledTimes(2);
    expect(onReject.mock.calls.map(([f, r]) => [f.name, r])).toEqual([
      ["3.txt", "count"],
      ["4.txt", "count"],
    ]);
    expect(screen.getAllByText("You can add up to 2 files.")).toHaveLength(1);
  });

  it("does not let a refused type use up a file slot", async () => {
    const { container, user } = setup({
      multiple: true,
      maxFiles: 1,
      accept: ".txt",
    });
    await user.upload(pickerOf(container), [file("a.png"), file("b.txt")]);
    expect(names(namedOf(container))).toEqual(["b.txt"]);
  });

  it("replaces the file without multiple, and keeps it when the new one is refused", async () => {
    const { container, user, onReject } = setup({ accept: ".txt" });
    await user.upload(pickerOf(container), file("a.txt"));
    await user.upload(pickerOf(container), file("b.txt"));
    expect(names(namedOf(container))).toEqual(["b.txt"]);
    await user.upload(pickerOf(container), file("c.png"));
    expect(names(namedOf(container))).toEqual(["b.txt"]);
    expect(onReject).toHaveBeenCalledTimes(1);

    drop(container, [file("d.txt"), file("e.txt")]);
    expect(names(namedOf(container))).toEqual(["d.txt"]);
    expect(onReject.mock.calls.at(-1)?.[1]).toBe("count");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You can add only one file.",
    );
  });

  it("empties the picker after each choice so the same file can be chosen again", async () => {
    const { container, user, onFilesChange } = setup({ multiple: true });
    const same = file("same.txt");
    const picker = pickerOf(container);
    await user.upload(picker, same);
    expect(picker.value).toBe("");
    expect(picker.files).toHaveLength(0);
    await user.upload(picker, same);
    expect(onFilesChange).toHaveBeenCalledTimes(2);
    expect(names(namedOf(container))).toEqual(["same.txt", "same.txt"]);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("keeps name on one input whose files mirror only the listed files", async () => {
    const { container, user } = setup({
      multiple: true,
      name: "docs",
      accept: ".txt",
    });
    const picker = pickerOf(container);
    const named = namedOf(container);
    expect(picker).not.toHaveAttribute("name");
    expect(named).toHaveAttribute("name", "docs");
    await user.upload(picker, [file("a.txt"), file("b.txt"), file("c.png")]);
    expect(names(named)).toEqual(["a.txt", "b.txt"]);
    await user.click(removeButton("a.txt"));
    expect(names(named)).toEqual(["b.txt"]);
  });

  it("removes a file and moves focus to a sensible place", async () => {
    const { container, user, onFilesChange } = setup({ multiple: true });
    await user.upload(pickerOf(container), [file("a.txt"), file("b.txt")]);
    await user.click(removeButton("a.txt"));
    expect(onFilesChange).toHaveBeenLastCalledWith([expect.any(File)]);
    expect(removeButton("b.txt")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Choose files/ })).toHaveFocus();
  });

  it("announces rejections in a live region that exists first, and again on a repeat", async () => {
    const { container, user } = setup({ accept: ".txt" });
    const alert = screen.getByRole("alert");
    expect(alert).toBeEmptyDOMElement();
    await user.upload(pickerOf(container), file("a.png"));
    const first = alert.firstElementChild;
    expect(alert).toHaveTextContent("a.png isn't an accepted file type.");
    await user.upload(pickerOf(container), file("a.png"));
    expect(alert.firstElementChild).not.toBe(first);
    expect(screen.getByRole("alert")).toBe(alert);
    await user.upload(pickerOf(container), file("a.txt"));
    expect(alert).toBeEmptyDOMElement();
  });

  it("renders file names as text only", async () => {
    const { container, user } = setup({ accept: ".txt" });
    const hostile = '<img src=x onerror="alert(1)">.txt';
    await user.upload(pickerOf(container), file(hostile));
    await user.upload(pickerOf(container), file('<b id="bad">.png'));
    expect(container.querySelector("img, #bad")).toBeNull();
    expect(screen.getByText(hostile)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent('<b id="bad">.png');
  });

  it("validates drops like the picker and refuses folders", () => {
    const { container, onReject } = setup({ multiple: true, accept: ".txt" });
    const folder = file("album.txt");
    drop(
      container,
      [file("a.txt"), folder, file("b.png")],
      [
        { kind: "file", webkitGetAsEntry: () => ({ isDirectory: false }) },
        { kind: "file", webkitGetAsEntry: () => ({ isDirectory: true }) },
        { kind: "file", webkitGetAsEntry: () => null },
      ],
    );
    expect(names(namedOf(container))).toEqual(["a.txt"]);
    expect(onReject.mock.calls.map(([f, r]) => [f.name, r])).toEqual([
      ["album.txt", "type"],
      ["b.png", "type"],
    ]);
  });

  it("marks the drag state only for file drags and clears it on leave and drop", () => {
    const { container } = setup();
    const zone = container.querySelector(".prava-file-upload__dropzone")!;
    fireEvent.dragEnter(zone, { dataTransfer: { types: ["text/plain"] } });
    expect(zone).not.toHaveAttribute("data-dragging");
    const notCancelled = fireEvent.dragOver(zone, {
      dataTransfer: { types: ["Files"] },
    });
    expect(notCancelled).toBe(false);
    expect(zone).toHaveAttribute("data-dragging");
    fireEvent.dragLeave(zone, { relatedTarget: document.body });
    expect(zone).not.toHaveAttribute("data-dragging");
    fireEvent.dragOver(zone, { dataTransfer: { types: ["Files"] } });
    drop(container, []);
    expect(zone).not.toHaveAttribute("data-dragging");
  });

  it("when disabled, refuses every route but still stops the browser navigating to a drop", () => {
    const { container, onFilesChange } = setup({ disabled: true });
    const zone = container.querySelector(".prava-file-upload__dropzone")!;
    expect(screen.getByRole("button", { name: /Choose files/ })).toBeDisabled();
    expect(pickerOf(container)).toBeDisabled();
    expect(namedOf(container)).toBeDisabled();
    expect(
      fireEvent.dragOver(zone, { dataTransfer: { types: ["Files"] } }),
    ).toBe(false);
    expect(zone).not.toHaveAttribute("data-dragging");
    expect(drop(container, [file("a.txt")])).toBe(false);
    expect(onFilesChange).not.toHaveBeenCalled();
  });

  it("works controlled: value wins and the named input follows it", async () => {
    function Controlled() {
      const [files, setFiles] = useState<File[]>([file("start.txt")]);
      return (
        <>
          <FileUpload multiple value={files} onFilesChange={setFiles} />
          <button onClick={() => setFiles([])}>Clear</button>
        </>
      );
    }
    const { container } = render(<Controlled />);
    const user = userEvent.setup();
    await waitFor(() =>
      expect(names(namedOf(container))).toEqual(["start.txt"]),
    );
    await user.upload(pickerOf(container), file("more.txt"));
    expect(names(namedOf(container))).toEqual(["start.txt", "more.txt"]);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(names(namedOf(container))).toEqual([]);
  });

  it("restores the named input when a controlled parent refuses the change", async () => {
    const start = [file("start.txt")];
    const { container } = render(<FileUpload multiple value={start} />);
    const user = userEvent.setup();
    await user.upload(pickerOf(container), file("more.txt"));
    await waitFor(() =>
      expect(names(namedOf(container))).toEqual(["start.txt"]),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("uses provider messages, and an Arabic subtree keeps name order isolated", async () => {
    const { container } = render(
      <PravaProvider
        direction="rtl"
        locale="ar"
        messages={{
          chooseFiles: "اختر",
          dropFiles: "أفلت",
          removeFile: "إزالة {label}",
          fileTypeRejected: "مرفوض {label}",
        }}
      >
        <FileUpload accept=".txt" />
      </PravaProvider>,
    );
    expect(container.querySelector("[dir='rtl']")).not.toBeNull();
    expect(screen.getByRole("button", { name: "اختر" })).toBeInTheDocument();
    expect(screen.getByText("أفلت")).toBeInTheDocument();
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(pickerOf(container), file("a.png"));
    expect(screen.getByRole("alert")).toHaveTextContent("مرفوض a.png");
    await user.upload(pickerOf(container), file("a.txt"));
    expect(
      screen.getByRole("button", { name: "إزالة a.txt" }),
    ).toBeInTheDocument();
    expect(screen.getByText("a.txt").tagName).toBe("BDI");
  });

  it("links description and error to the button, and forwards root and slot styling", () => {
    const { container } = render(
      <FileUpload
        label="Docs"
        description="PDF only"
        error="Add a file"
        className="mine"
        style={{ margin: 1 }}
        classNames={{ dropzone: "zone" }}
        data-testid="button"
        value={[file("a.txt")]}
      />,
    );
    const button = screen.getByTestId("button");
    expect(button).toHaveAccessibleDescription("PDF only Add a file");
    expect(button).toHaveAttribute("aria-invalid", "true");
    const root = container.firstElementChild!;
    expect(root).toHaveClass("prava-file-upload", "mine");
    expect(root).toHaveAttribute("style");
    expect(root.querySelector(".zone")).not.toBeNull();
  });

  it("forwards its ref to the named input, whose focus goes to the button", () => {
    const ref = createRef<HTMLInputElement>();
    render(<FileUpload ref={ref} name="docs" />);
    expect(ref.current).toHaveAttribute("name", "docs");
    act(() => ref.current!.focus());
    expect(screen.getByRole("button", { name: /Choose files/ })).toHaveFocus();
  });

  it("shows a localized required message on submit, moves focus, and clears it after choosing", async () => {
    const { container } = render(
      <form>
        <FileUpload label="Docs" required name="docs" />
        <button type="submit">Send</button>
      </form>,
    );
    const button = screen.getByRole("button", { name: /Choose files/ });
    expect(button).toHaveAccessibleName("Docs Required Choose files");
    fireEvent.invalid(namedOf(container));
    await waitFor(() => expect(button).toHaveAttribute("aria-invalid", "true"));
    expect(button).toHaveFocus();
    await userEvent.upload(pickerOf(container), file("a.txt"));
    await waitFor(() => expect(button).not.toHaveAttribute("aria-invalid"));
  });

  it("clears on native form reset and tells the consumer", async () => {
    const onFilesChange = vi.fn();
    const { container } = render(
      <form data-testid="form">
        <FileUpload accept=".txt" onFilesChange={onFilesChange} />
      </form>,
    );
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(pickerOf(container), file("a.txt"));
    await user.upload(pickerOf(container), file("b.png"));
    expect(screen.getByRole("alert")).not.toBeEmptyDOMElement();
    act(() => screen.getByTestId<HTMLFormElement>("form").reset());
    await waitFor(() =>
      expect(screen.queryByRole("list")).not.toBeInTheDocument(),
    );
    expect(onFilesChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("works inside FormField without an invalid aria-required on the button", () => {
    render(
      <FormField
        label="Docs"
        required
        description="PDF"
        control={<FileUpload />}
      />,
    );
    const button = screen.getByRole("button", { name: /Docs/ });
    expect(button).not.toHaveAttribute("aria-required");
    expect(button).toHaveAccessibleDescription("PDF");
  });
});

describe("FileUpload with react-hook-form", () => {
  it("register: submits a FileList, validates required, focuses the button, and resets", async () => {
    const onSubmit = vi.fn();
    function Form() {
      const { register, handleSubmit, reset, formState } = useForm<{
        docs: FileList;
      }>();
      return (
        <form noValidate onSubmit={handleSubmit((v) => onSubmit(v.docs))}>
          <FileUpload
            label="Docs"
            multiple
            error={formState.errors.docs?.message}
            field={register("docs", { required: "Add a file" })}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => reset()}>
            Reset
          </button>
        </form>
      );
    }
    const { container } = render(<Form />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Add a file")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Choose files/ })).toHaveFocus();

    await user.upload(pickerOf(container), [file("a.txt"), file("b.txt")]);
    await waitFor(() =>
      expect(screen.queryByText("Add a file")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(
      Array.from(onSubmit.mock.calls[0]![0] as FileList).map((f) => f.name),
    ).toEqual(["a.txt", "b.txt"]);

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() =>
      expect(screen.queryByRole("list")).not.toBeInTheDocument(),
    );
    expect(names(namedOf(container))).toEqual([]);
  });

  it("Controller: stores File[], not a fake path, and follows reset", async () => {
    const onSubmit = vi.fn();
    function Form() {
      const { control, handleSubmit, reset } = useForm<{ docs: File[] }>({
        defaultValues: { docs: [] },
      });
      return (
        <form noValidate onSubmit={handleSubmit((v) => onSubmit(v.docs))}>
          <Controller
            control={control}
            name="docs"
            render={({ field }) => (
              <FileUpload label="Docs" multiple field={field} />
            )}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => reset()}>
            Reset
          </button>
        </form>
      );
    }
    const { container } = render(<Form />);
    const user = userEvent.setup();
    const chosen = file("a.txt");
    await user.upload(pickerOf(container), chosen);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith([chosen]));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() =>
      expect(screen.queryByRole("list")).not.toBeInTheDocument(),
    );
    expect(names(namedOf(container))).toEqual([]);
  });
});
