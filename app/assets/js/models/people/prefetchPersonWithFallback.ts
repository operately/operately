import Api, { type PeopleGetInput, type PeopleGetMeInput } from "@/api";
import { compareIds } from "@/routes/paths";

/** Guests may get a 404 for their own profile; use getMe only when the requested ID matches. */
export async function prefetchPersonWithFallback(
  personInput: PeopleGetInput,
  meInput: PeopleGetMeInput = {},
): Promise<PeopleGetMeInput | null> {
  try {
    await Api.people.getQuery(personInput);
    return null;
  } catch (error: unknown) {
    if (typeof error !== "object" || error === null || !("status" in error) || error.status !== 404) throw error;

    const { me } = await Api.people.getMeQuery(meInput);
    if (!me || !compareIds(me.id, personInput.id)) throw error;

    return meInput;
  }
}
