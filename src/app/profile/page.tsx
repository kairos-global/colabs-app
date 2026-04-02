import { getProfilePageData } from "./actions";
import { ProfileView } from "./ProfileView";

export default async function ProfilePage() {
  const data = await getProfilePageData();
  return <ProfileView data={data} />;
}
