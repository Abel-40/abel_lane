import { notFound } from "next/navigation";

/*
 * Default for the (site) layout's `children` slot. It does exactly what Next's built-in default does (404), but
 * Next 16.4.5's strict route matching only accepts an explicit file: @modal/[...catchAll] is attached to every URL,
 * including the private /mezgeb/* pages under the other root layout, and without this file Next removed those routes.
 */
export default function Default() {
  notFound();
}
