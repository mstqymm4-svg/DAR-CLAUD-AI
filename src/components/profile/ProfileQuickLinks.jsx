import { Link } from "react-router-dom";
import { Heart, BookOpen, Video } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function ProfileQuickLinks() {
  const t = useT();
  const links = [
  { to: "/favorites", icon: Heart, label: t.navFav },
  { to: "/books", icon: BookOpen, label: t.navBooks },
  { to: "/videos", icon: Video, label: t.navVideos }];

  return (
    <div className="grid grid-cols-3 gap-2">
      {links.map(({ to, icon: Icon, label }) =>
      <Link
        key={to}
        to={to}
        className="flex flex-col items-center gap-1.5 py-3 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/15 transition-colors rounded-[4px_20px_4px_20px] hidden">
        
          <Icon className="w-4 h-4" />
          <span className="text-[11px] font-bold">{label}</span>
        </Link>
      )}
    </div>);

}