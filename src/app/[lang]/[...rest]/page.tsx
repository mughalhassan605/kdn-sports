import { notFound } from "next/navigation";

// Any unknown path renders the localized not-found page inside the site layout.
export default function CatchAll() {
  notFound();
}
