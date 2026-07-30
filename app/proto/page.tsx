import { redirect } from "next/navigation";

// The prototype used to live here; the game is at the root now. Old links still work.
export default function ProtoRedirect() {
  redirect("/");
}
