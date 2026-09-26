import { LegalView, legalMetadata } from "@/components/store/LegalView";

export const revalidate = 60;
export const generateMetadata = () => legalMetadata("privacidad");

export default function Page() {
  return <LegalView slug="privacidad" />;
}
