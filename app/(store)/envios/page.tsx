import { LegalView, legalMetadata } from "@/components/store/LegalView";

export const revalidate = 60;
export const generateMetadata = () => legalMetadata("envios");

export default function Page() {
  return <LegalView slug="envios" />;
}
