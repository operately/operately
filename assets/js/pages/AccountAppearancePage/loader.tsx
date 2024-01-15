import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

interface LoadedData {
  me: People.Person;
}

export async function loader(): Promise<LoadedData> {
  return {
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
