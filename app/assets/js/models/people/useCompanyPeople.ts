import Api from "@/api";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const THREE_HOURS = 3 * 60 * 60 * 1000;

export function companyPeopleQueryOptions() {
  return {
    ...Api.people.listQueryOptions({ includeSuspended: true }),
    refetchInterval: THREE_HOURS,
    refetchIntervalInBackground: true,
    refetchOnReconnect: true,
    retry: (failureCount: number, error: Error) =>
      failureCount < 2 && axios.isAxiosError(error) && error.code === "ERR_NETWORK",
  };
}

export function useCompanyPeople() {
  return useQuery(companyPeopleQueryOptions());
}
