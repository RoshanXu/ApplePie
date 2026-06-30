import { redirect } from "next/navigation";

/**
 * Root page — redirect to student onboarding during MVP development.
 * When auth is enabled: check session → student→/home, parent→/parent, anon→/onboard
 */
export default function Home() {
  redirect("/onboard");
}
