import Homebar from "./components/Homebar";
import Feed from "./components/Feed";
import Notificationsbar from "./components/Notificationsbar";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden ">
      <div className="w-1/4 border-r-2 border-black">
        <Homebar />
      </div>
      <div className=" w-1/2 overflow-y-auto">
        <Feed />
      </div>
      <div className="w-1/4">
        <Notificationsbar />
      </div>
    </div>
  );
}
