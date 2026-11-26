import { queryOptions } from "@tanstack/react-query";
import { getHome } from "./tmdb.functions";

export const homeQuery = queryOptions({ queryKey: ["freshflix-home", 4], queryFn: () => getHome(), staleTime: 600_000 });