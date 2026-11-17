import { PravaProvider, Toaster } from "../index";
import { TeamPage } from "./TeamPage";

export default { title: "Readme/TeamPage" };
export const Default = () => (
  <PravaProvider>
    <TeamPage />
    <Toaster />
  </PravaProvider>
);
export const Rtl = () => (
  <PravaProvider direction="rtl" locale="ar" theme="dark">
    <TeamPage />
    <Toaster />
  </PravaProvider>
);

