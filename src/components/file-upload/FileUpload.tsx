import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  DragEvent,
  FocusEvent,
  FocusEventHandler,
  FormEventHandler,
  ReactNode,
} from "react";
import { Button } from "../button";
import {
  bindField,
  fillMessage,
  onPropertyWrite,
  setRef,
  useField,
  type FieldBinding,
  type FieldProps,
} from "../field/field";
import { usePravaConfig } from "../provider/PravaProvider";
import { useControllable } from "../../internal/useControllable";

/** Why a file was refused: wrong `accept` type, over `maxSize`, or past the file limit. */
export type FileRejectReason = "type" | "size" | "count";

export type FileUploadProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "children"
  | "defaultValue"
  | "form"
  | "name"
  | "onBlur"
  | "onChange"
  | "onInvalid"
  | "type"
  | "value"
> &
  Omit<FieldProps, "field"> & {
    /** Visible label above the control. */
    label?: ReactNode;
    /** Accepted types, as on a file input: extensions (`.pdf`), MIME types (`image/png`), or wildcards (`image/*`). */
    accept?: string;
    /** Keeps a list that each choice adds to. Without it, a new file replaces the current one. */
    multiple?: boolean;
    /** Largest accepted size per file, in bytes. Messages show it in units of 1024 bytes. */
    maxSize?: number;
    /** Most files the list can hold when `multiple` is set. */
    maxFiles?: number;
    /** Controlled list of files. Omit it to let the component keep the list. */
    value?: readonly File[];
    /** Called with the whole list when files are added or removed, or the form resets. */
    onFilesChange?: (files: File[]) => void;
    /** Called once for each refused file. */
    onReject?: (file: File, reason: FileRejectReason) => void;
    /** Form field name. Native submission sends the listed files under it. */
    name?: string;
    /** Id of the form the named input belongs to, when it isn't an ancestor. */
    form?: string;
    /** Native form validation fails while the list is empty. */
    required?: boolean;
    /** Connects react-hook-form: `field={register("files")}` gives a FileList; Controller's `field={field}` gives `File[]`. */
    field?: FieldBinding;
    /** Change event from the named file input; react-hook-form uses this. */
    onChange?: ChangeEventHandler<HTMLInputElement>;
    /** Runs when focus leaves the component. */
    onBlur?: FocusEventHandler<HTMLInputElement>;
    /** Runs when native validation fails on the named file input. */
    onInvalid?: FormEventHandler<HTMLInputElement>;
    /** Extra classes for the inner slots. */
    classNames?: {
      dropzone?: string;
      list?: string;
      item?: string;
      remove?: string;
    };
  };

const NO_FILES: File[] = [];
const SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];

const classes = (...names: (string | undefined)[]) =>
  names.filter(Boolean).join(" ");

const formatSize = (bytes: number, locale: string) => {
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: SIZE_UNITS[unit],
    maximumFractionDigits: 1,
  }).format(size);
};

// A file with no reported type can only match by extension, as in the browser's own picker.
const matchesAccept = (file: File, accept = "") => {
  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  const name = file.name.toLowerCase();
  const type = file.type.split(";")[0]!.trim().toLowerCase();
  return (
    !tokens.length ||
    tokens.some((token) =>
      token.startsWith(".")
        ? name.endsWith(token)
        : token === "*/*" ||
          (token.endsWith("/*")
            ? type.startsWith(token.slice(0, -1))
            : type === token),
    )
  );
};

const sameFiles = (list: FileList | null, files: readonly File[]) =>
  (list?.length ?? 0) === files.length &&
  files.every((file, i) => {
    // DataTransfer may hand back a new File object, so compare what identifies the file.
    const other = list![i]!;
    return (
      other.name === file.name &&
      other.size === file.size &&
      other.lastModified === file.lastModified
    );
  });

const writeFiles = (input: HTMLInputElement, files: readonly File[]) => {
  // shortcut: without DataTransfer (jsdom) the list works but native submit omits the files, upgrade only if a supported browser lacks it.
  if (typeof DataTransfer === "undefined") return;
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
};

/**
 * Lets people choose files with a real button or by drag and drop, and lists them with a remove
 * button each. The consumer performs the upload.
 *
 * Client checks (`accept`, `maxSize`, `maxFiles`) are a convenience and can be bypassed. The server
 * must validate every file itself.
 *
 * In a form, `name` sits on a hidden file input whose `files` mirror the list through `DataTransfer`,
 * so native submission and `ref` hold exactly the listed files, never rejected or removed ones. A
 * second, nameless input opens the picker and is emptied after each choice, so choosing the same
 * file again still works.
 * @example
 * ```tsx
 * import { FileUpload } from 'prava-ui/file-upload';
 * <FileUpload
 *   label={t('attachments')}
 *   name="attachments"
 *   multiple
 *   accept="image/*,.pdf"
 *   maxSize={5 * 1024 * 1024}
 *   maxFiles={3}
 *   onFilesChange={setFiles}
 *   onReject={(file, reason) => log(file.name, reason)}
 * />
 * ```
 */
export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  function FileUpload(rawProps, forwardedRef) {
    const binding = rawProps.field;
    const {
      label,
      accept,
      multiple = false,
      maxSize,
      maxFiles,
      value,
      onFilesChange,
      onReject,
      name,
      form,
      required,
      disabled,
      onChange,
      onBlur,
      onInvalid,
      description,
      error,
      invalid,
      id,
      className,
      style,
      classNames,
      onClick,
      ref,
      ...buttonProps
    } = bindField<HTMLInputElement, FileUploadProps>(
      // Controller stores event.target.value, a fake path, so it gets the File[] instead of the event.
      binding && "value" in binding
        ? {
            ...rawProps,
            field: { ...binding, onChange: undefined },
            onFilesChange: (files) => {
              (
                binding.onChange as unknown as
                  ((next: File[]) => unknown) | undefined
              )?.(files);
              rawProps.onFilesChange?.(files);
            },
          }
        : rawProps,
      forwardedRef,
    );

    const { messages, locale } = usePravaConfig();
    const field = useField<HTMLInputElement>({
      id,
      description,
      error,
      invalid,
      onBlur,
      onChange,
      onInvalid,
      "aria-describedby": buttonProps["aria-describedby"],
      "aria-invalid": buttonProps["aria-invalid"],
    });
    const {
      id: buttonId,
      "aria-invalid": ariaInvalid,
      "aria-describedby": describedBy,
      ...handlers
    } = field.controlProps;

    const [files, setFiles] = useControllable<readonly File[]>(
      // A form library's empty default can be "" or null rather than undefined.
      (value || undefined) as readonly File[] | undefined,
      NO_FILES,
      onFilesChange as ((next: readonly File[]) => void) | undefined,
    );
    const [dragging, setDragging] = useState(false);
    const [notices, setNotices] = useState({ id: 0, texts: [] as string[] });

    const rootRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLInputElement>(null);
    const namedRef = useRef<HTMLInputElement | null>(null);
    const focusAfterRemove = useRef<number | null>(null);
    const latest = useRef({ files, setFiles });

    const showNotices = (texts: string[]) =>
      setNotices((prev) => ({ id: prev.id + 1, texts }));
    const chooseButton = () =>
      rootRef.current?.querySelector<HTMLButtonElement>(
        ".prava-file-upload__button",
      );

    useEffect(() => {
      latest.current = { files, setFiles };
      // The named input follows the list, including a controlled value that changed or refused a change.
      const named = namedRef.current;
      if (named && !sameFiles(named.files, files)) writeFiles(named, files);

      if (focusAfterRemove.current === null) return;
      const buttons = rootRef.current?.querySelectorAll<HTMLButtonElement>(
        ".prava-file-upload__remove",
      );
      const next =
        buttons?.[Math.min(focusAfterRemove.current, buttons.length - 1)];
      focusAfterRemove.current = null;
      (next ?? chooseButton())?.focus();
    });

    // Runs for form.reset() and for react-hook-form, which empties a file input through its value.
    const clear = useCallback(() => {
      setNotices((prev) => ({ id: prev.id + 1, texts: [] }));
      if (latest.current.files.length) latest.current.setFiles(NO_FILES);
    }, []);

    useEffect(() => {
      const owner = namedRef.current?.form;
      owner?.addEventListener("reset", clear);
      return () => owner?.removeEventListener("reset", clear);
    }, [clear]);

    const namedInput = useCallback(
      (el: HTMLInputElement | null) => {
        if (el) {
          namedRef.current = el;
          onPropertyWrite(el, "value", clear);
          // defineProperty, not assignment: this must stay on the element and never reach HTMLElement.prototype.
          Object.defineProperty(el, "focus", {
            configurable: true,
            value: (focusOptions?: FocusOptions) =>
              chooseButton()?.focus(focusOptions),
          });
        }
        setRef(ref, el);
      },
      [ref, clear],
    );

    const commit = (next: readonly File[]) => {
      const named = namedRef.current;
      if (named) writeFiles(named, next);
      setFiles(next);
      named?.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const intake = (incoming: File[], folders?: ReadonlySet<number>) => {
      const kept = multiple ? files : NO_FILES;
      const limit = multiple ? (maxFiles ?? Infinity) : 1;
      const accepted: File[] = [];
      const texts = new Set<string>();
      incoming.forEach((file, i) => {
        const reason: FileRejectReason | undefined =
          folders?.has(i) || !matchesAccept(file, accept)
            ? "type"
            : maxSize !== undefined && file.size > maxSize
              ? "size"
              : kept.length + accepted.length >= limit
                ? "count"
                : undefined;
        if (!reason) {
          accepted.push(file);
          return;
        }
        onReject?.(file, reason);
        const params = { label: file.name };
        texts.add(
          reason === "type"
            ? fillMessage(messages.fileTypeRejected, params, locale)
            : reason === "size"
              ? fillMessage(
                  messages.fileTooLarge,
                  { ...params, max: formatSize(maxSize!, locale) },
                  locale,
                )
              : limit === 1
                ? messages.oneFileOnly
                : fillMessage(messages.tooManyFiles, { count: limit }, locale),
        );
      });
      showNotices([...texts]);
      if (accepted.length) commit([...kept, ...accepted]);
    };

    const onDragOver = (event: DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      // Even when disabled: an uncancelled drop navigates away and loses the page's form.
      event.preventDefault();
      event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      if (!disabled) setDragging(true);
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
      const { types, items, files: dropped } = event.dataTransfer;
      if (!types.includes("Files")) return;
      event.preventDefault();
      setDragging(false);
      if (disabled) return;
      // A dropped folder arrives as a file-like entry that can't be read; the picker never offers one.
      const folders = new Set(
        Array.from(items)
          .filter((item) => item.kind === "file")
          .flatMap((item, i) =>
            item.webkitGetAsEntry()?.isDirectory ? [i] : [],
          ),
      );
      intake(Array.from(dropped), folders);
    };

    // The real control is the hidden named input, so leaving the component is reported through it.
    const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
      if ((event.target as Element) === namedRef.current) return;
      if (rootRef.current?.contains(event.relatedTarget as Node | null)) return;
      // Still the active element: the window lost focus, for example to the file dialog.
      if (document.activeElement === event.target) return;
      namedRef.current?.dispatchEvent(
        new FocusEvent("focusout", { bubbles: true }),
      );
    };

    const labelId = `${buttonId}-label`;

    return (
      <div
        ref={rootRef}
        className={classes("prava-field prava-file-upload", className)}
        style={style}
        data-disabled={disabled || undefined}
        data-invalid={ariaInvalid}
        onBlur={onRootBlur}
      >
        {label != null && (
          <label
            id={labelId}
            className="prava-field__legend"
            htmlFor={buttonId}
          >
            {label}
            {required && (
              <span className="prava-label__required">{messages.required}</span>
            )}
          </label>
        )}
        <div
          className={classes(
            "prava-file-upload__dropzone",
            classNames?.dropzone,
          )}
          data-dragging={dragging || undefined}
          onDragEnter={onDragOver}
          onDragOver={onDragOver}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setDragging(false);
          }}
          onDrop={onDrop}
        >
          <Button
            aria-labelledby={
              label != null ? `${labelId} ${buttonId}-text` : undefined
            }
            {...buttonProps}
            // FormField passes this, but a button cannot carry it; the label states it.
            aria-required={undefined}
            id={buttonId}
            variant="secondary"
            className="prava-file-upload__button"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-describedby={describedBy}
            onClick={(event) => {
              onClick?.(event);
              pickerRef.current?.click();
            }}
          >
            <span id={`${buttonId}-text`}>{messages.chooseFiles}</span>
          </Button>
          <span className="prava-file-upload__hint">{messages.dropFiles}</span>
        </div>
        <input
          ref={pickerRef}
          type="file"
          hidden
          className="prava-file-upload__input"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            const chosen = Array.from(event.target.files ?? []);
            // Browsers fire no change for an unchanged selection, so a repeat choice needs it empty.
            event.target.value = "";
            intake(chosen);
          }}
        />
        <input
          {...handlers}
          ref={namedInput}
          type="file"
          hidden
          name={name}
          form={form}
          multiple={multiple}
          required={required}
          disabled={disabled}
        />
        {files.length > 0 && (
          <ul className={classes("prava-file-upload__list", classNames?.list)}>
            {files.map((file, index) => (
              <li
                key={index}
                className={classes("prava-file-upload__item", classNames?.item)}
              >
                <bdi className="prava-file-upload__name">{file.name}</bdi>
                <span className="prava-file-upload__size">
                  {formatSize(file.size, locale)}
                </span>
                <Button
                  type="icon"
                  size="sm"
                  variant="ghost"
                  className={classes(
                    "prava-file-upload__remove",
                    classNames?.remove,
                  )}
                  disabled={disabled}
                  aria-label={fillMessage(
                    messages.removeFile,
                    { label: file.name },
                    locale,
                  )}
                  onClick={() => {
                    focusAfterRemove.current = index;
                    showNotices([]);
                    commit(files.filter((_, i) => i !== index));
                  }}
                >
                  <svg
                    className="prava-file-upload__remove-icon"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M4.5 4.5l7 7m0-7l-7 7" />
                  </svg>
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div role="status" className="prava-file-upload__status">
          {files.length > 0 &&
            fillMessage(
              messages.selectedCount,
              { count: files.length },
              locale,
            )}
        </div>
        {/* Stays mounted so screen readers track it; a fresh key announces a repeated rejection again. */}
        <div role="alert" className="prava-file-upload__rejections">
          {notices.texts.map((text) => (
            <div key={`${notices.id}-${text}`} className="prava-field__error">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 4.75v3.5M8 11h.01" />
              </svg>
              <span>{text}</span>
            </div>
          ))}
        </div>
        {field.messages}
      </div>
    );
  },
);
