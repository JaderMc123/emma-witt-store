import { LegalView, legalMetadata } from "@/components/store/LegalView";

export const revalidate = 60;
export const generateMetadata = () => legalMetadata("cambios-y-devoluciones");

export default function Page() {
  return <LegalView slug="cambios-y-devoluciones" />;
}
