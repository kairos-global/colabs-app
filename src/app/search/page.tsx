import { getCommunityListings } from "@/app/community/actions";
import ListingSearch from "./ListingSearch";

export default async function SearchPage() {
  const listings = await getCommunityListings();
  return <ListingSearch initialListings={listings} />;
}
