import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, BriefcaseBusiness, Check, ChevronLeft, ChevronRight, Clock3, Compass, Download, FileText, FlaskConical, Github, HeartPulse, House, List, Menu, Plus, RefreshCw, Scale, Search, ShieldCheck, Trash2, UsersRound, Wallet, X } from 'lucide-react';
const icons = { ArrowRight, ArrowUpRight, BookOpen, Bookmark, BriefcaseBusiness, Check, ChevronLeft, ChevronRight, Clock3, Compass, Download, FileText, FlaskConical, Github, HeartPulse, House, List, Menu, Plus, RefreshCw, Scale, Search, ShieldCheck, Trash2, UsersRound, Wallet, X };
export default function Icon({ name, size = 20, ...props }) {
  const Component = icons[name] || Compass;
  return <Component size={size} strokeWidth={1.6} aria-hidden="true" {...props} />;
}
