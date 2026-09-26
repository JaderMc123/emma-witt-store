import { LegalView, legalMetadata } from "@/components/store/LegalView";

export const revalidate = 60;
export const generateMetadata = () => legalMetadata("tratamiento-de-datos");

export default function Page() {
  return <LegalView slug="tratamiento-de-datos" />;
}
