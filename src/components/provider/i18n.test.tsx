import { act, render, screen } from "@testing-library/react";
import i18next from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider, Trans, useTranslation } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionItem,
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Combobox,
  DatePicker,
  Dialog,
  Drawer,
  DropdownMenu,
  EmptyState,
  FileUpload,
  FormField,
  Input,
  Label,
  NumberInput,
  Popover,
  Progress,
  PravaProvider,
  RadioGroup,
  Select,
  Slider,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
  Tabs,
  Tag,
  Textarea,
  Tooltip,
} from "../../index";

const i18n = i18next.createInstance();
void i18n.init({
  lng: "en",
  resources: {
    en: { translation: { text: "Hello", close: "Close" } },
    es: { translation: { text: "Hola", close: "Cerrar" } },
  },
  interpolation: { escapeValue: false },
});

// <Trans> alone doesn't subscribe to language changes; apps call useTranslation, as here.
function Translated() {
  const { t } = useTranslation(undefined, { i18n });
  return <Trans t={t} i18nKey="text" />;
}
const T = <Translated />;
const inTabs = (
  <Tabs defaultValue="a">
    <TabList aria-label="Tabs">
      <Tab value="a">{T}</Tab>
    </TabList>
    <TabPanel value="a">Panel</TabPanel>
  </Tabs>
);

// Every text-bearing prop that accepts a node, in the real library's <Trans>.
const cases: [string, ReactNode][] = [
  [
    "Accordion",
    <Accordion>
      <AccordionItem value="a" title={T}>
        x
      </AccordionItem>
    </Accordion>,
  ],
  ["Alert", <Alert title={T} />],
  ["Badge", <Badge content={T} />],
  ["Breadcrumb", <Breadcrumb items={[{ label: T }]} />],
  ["Button", <Button>{T}</Button>],
  ["Card", <Card>{T}</Card>],
  ["Checkbox", <Checkbox label={T} />],
  ["Combobox", <Combobox label={T} options={[]} />],
  ["DatePicker", <DatePicker label={T} />],
  [
    "Dialog",
    <Dialog defaultOpen title={T}>
      x
    </Dialog>,
  ],
  [
    "Drawer",
    <Drawer defaultOpen title={T}>
      x
    </Drawer>,
  ],
  [
    "DropdownMenu",
    <DropdownMenu
      defaultOpen
      trigger={<button>m</button>}
      items={[{ label: T }]}
    />,
  ],
  ["EmptyState", <EmptyState title={T} />],
  ["FileUpload", <FileUpload label={T} />],
  ["FormField", <FormField label={T} control={<Textarea />} />],
  ["Input", <Input label={T} />],
  ["Label", <Label>{T}</Label>],
  ["NumberInput", <NumberInput label={T} />],
  [
    "Popover",
    <Popover defaultOpen trigger={<button>p</button>} title={T}>
      x
    </Popover>,
  ],
  ["Progress", <Progress label={T} value={1} />],
  ["RadioGroup", <RadioGroup label={T} options={[]} />],
  ["Select", <Select label={T} options={[]} />],
  ["Slider", <Slider label={T} />],
  ["Spinner", <Spinner label={T} />],
  ["Switch", <Switch label={T} />],
  [
    "Table",
    <Table>
      <TableCaption>{T}</TableCaption>
      <TableBody>
        <TableRow>
          <TableCell>x</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  ],
  ["Tabs", inTabs],
  ["Tag", <Tag>{T}</Tag>],
  [
    "Tooltip",
    <Tooltip content={T}>
      <button>t</button>
    </Tooltip>,
  ],
];

describe("react-i18next integration", () => {
  beforeEach(() => act(async () => void (await i18n.changeLanguage("en"))));

  it.each(cases)(
    "%s renders <Trans> and follows a language change",
    async (_, ui) => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>,
      );
      expect(container.textContent).toContain("Hello");
      await act(async () => void (await i18n.changeLanguage("es")));
      expect(container.textContent).toContain("Hola");
      expect(container.textContent).not.toContain("Hello");
    },
  );

  it("feeds t() into built-in messages and updates them with the language", async () => {
    function App() {
      const { t } = useTranslation(undefined, { i18n });
      return (
        <PravaProvider locale={i18n.language} messages={{ close: t("close") }}>
          <Dialog defaultOpen title="Title">
            x
          </Dialog>
        </PravaProvider>
      );
    }
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Close", hidden: true }),
    ).toBeTruthy();
    await act(async () => void (await i18n.changeLanguage("es")));
    expect(
      screen.getByRole("button", { name: "Cerrar", hidden: true }),
    ).toBeTruthy();
  });
});
