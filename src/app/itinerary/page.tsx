import { redirect } from "next/navigation";

/** The itinerary now lives on the combined Tour page; keep old links working. */
export default function ItineraryRedirect() {
  redirect("/tour");
}
