import AvailabilityDashboard from "../components/AvailabilityDashboard";
import UserProfileForm from "../components/UserProfileForm";

export default function UserAvailability() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <UserProfileForm />
      <AvailabilityDashboard role="USER" />
    </div>
  );
}
