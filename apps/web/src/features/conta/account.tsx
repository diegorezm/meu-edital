import { AccountView } from "./components/AccountView";
import { useAccount } from "./hooks/useAccount";
import { useNotifications } from "./hooks/useNotifications";
import { usePrivacy } from "./hooks/usePrivacy";

export default function AccountSection() {
  return <AccountView form={useAccount()} notifications={useNotifications()} privacy={usePrivacy()} />;
}
