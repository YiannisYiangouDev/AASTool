import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../api/endpoints";

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: () => endpoints.getAssessment(id),
    enabled: !!id,
  });
}
