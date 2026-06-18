import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../api/endpoints";

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => endpoints.getBuildings(),
  });
}
