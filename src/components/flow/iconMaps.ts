import {
  Globe, FileText, Share2, ClipboardList, UserPlus, Footprints, Newspaper,
  MessageCircle, Mail, MessageSquare, Calendar, GitBranch, Tag, Bell, BellRing,
  Zap, Bot, Mic, Filter, Star, Users,
} from "lucide-react";

/** Icon map for step/action nodes (used by ActionNode, StepPicker, FloatingStepPicker) */
export const STEP_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  MessageCircle, Mail, MessageSquare, Calendar, GitBranch, Tag, Bell, BellRing,
  Zap, Bot, Mic, Filter, Star, Users,
};

/** Icon map for source nodes */
export const SOURCE_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Globe, FileText, Share2, ClipboardList, UserPlus, Footprints, Newspaper, Users,
};
