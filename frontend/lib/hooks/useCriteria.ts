import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../api/endpoints";
import type { Criterion } from "../../types";

export function useCriteria() {
  return useQuery<Criterion[]>({
    queryKey: ['criteria'],
    queryFn: () => endpoints.getCriteria(),
  });
}
