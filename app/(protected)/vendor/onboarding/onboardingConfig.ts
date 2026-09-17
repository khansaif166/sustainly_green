/**
 * Onboarding scope switch.
 *
 * The full form collects 59 fields across four steps. Tracing each column
 * showed only about a dozen ever reach a public page, and fifteen — the whole
 * Eco Score block among them — were written and then read by nothing at all.
 * The client asked to collect only the essentials for now.
 *
 * Nothing has been deleted. Every field, component and step still exists;
 * setting this to `true` brings the full four-step form back exactly as it was.
 *
 * Note that fields hidden by this flag are `.optional()` in schema.ts, so that
 * the form can submit in either mode. If the full form is restored permanently,
 * revisit which of them should be mandatory again.
 */
export const SHOW_FULL_ONBOARDING = false;
