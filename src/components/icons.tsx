/**
 * Icon adapter: lucide-react -> HugeIcons (free set).
 *
 * Each export below is a drop-in replacement for the lucide-react icon of the
 * same name. They accept a lucide-compatible API (className, size, color, plus
 * any other SVG props) and render the closest HugeIcons free icon via the
 * HugeiconsIcon renderer. Existing JSX such as <Plus className="h-4 w-4" /> or
 * <Loader2 className="animate-spin" /> keeps working unchanged because the
 * className is forwarded to the rendered svg.
 *
 * To migrate a file, only the import source changes; the named imports stay the
 * same: import { Plus, Search } from '@/components/icons'
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { ComponentPropsWithoutRef } from 'react';
import {
  Add01Icon,
  Alert02Icon,
  AlertCircleIcon,
  ArrowDataTransferHorizontalIcon,
  ArrowDown01Icon,
  ArrowDownRight01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  BedDoubleIcon,
  BedSingle01Icon,
  Building01Icon,
  Building02Icon,
  Calculator01Icon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
  CalendarRemove01Icon,
  Call02Icon,
  Camera01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  ChartBarLineIcon,
  CheckmarkCircle01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Clock01Icon,
  Copy01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Delete02Icon,
  DollarCircleIcon,
  Download01Icon,
  Edit02Icon,
  Edit03Icon,
  File01Icon,
  FloppyDiskIcon,
  Home01Icon,
  Hotel01Icon,
  InformationCircleIcon,
  LinkSquare01Icon,
  Loading03Icon,
  Location01Icon,
  Logout01Icon,
  Mail01Icon,
  Money01Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  PencilEdit01Icon,
  PercentIcon,
  PrinterIcon,
  ReceiptDollarIcon,
  RefreshIcon,
  RupeeIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  Shield01Icon,
  SidebarLeftIcon,
  SmartPhone01Icon,
  SnowIcon,
  StarIcon,
  Tick02Icon,
  TradeUpIcon,
  Upload01Icon,
  UserAdd01Icon,
  UserCheck01Icon,
  UserIcon,
  UserMultipleIcon,
  UserRemove01Icon,
  ViewIcon,
  ViewOffIcon,
  Wallet01Icon,
  WindPowerIcon,
} from '@hugeicons/core-free-icons';

/**
 * Props mirroring lucide-react LucideProps: size controls both width and height
 * (default 24, like lucide); className/color/etc. forward to the rendered svg.
 */
export type IconProps = Omit<ComponentPropsWithoutRef<'svg'>, 'ref'> & {
  size?: string | number;
  strokeWidth?: number;
};

function makeIcon(icon: IconSvgElement) {
  function Icon({ size = 24, strokeWidth, ...props }: IconProps) {
    return (
      <HugeiconsIcon
        icon={icon}
        size={size}
        {...(strokeWidth != null ? { strokeWidth } : {})}
        {...props}
      />
    );
  }
  return Icon;
}

export const AlertCircle = makeIcon(AlertCircleIcon);
export const AlertTriangle = makeIcon(Alert02Icon);
export const ArrowDownRight = makeIcon(ArrowDownRight01Icon);
export const ArrowLeft = makeIcon(ArrowLeft02Icon);
export const ArrowRight = makeIcon(ArrowRight02Icon);
export const ArrowRightLeft = makeIcon(ArrowDataTransferHorizontalIcon);
export const ArrowUpRight = makeIcon(ArrowUpRight01Icon);
export const Ban = makeIcon(CancelCircleIcon);
export const Banknote = makeIcon(Money01Icon);
export const BarChart3 = makeIcon(ChartBarLineIcon);
export const Bed = makeIcon(BedSingle01Icon);
export const BedDouble = makeIcon(BedDoubleIcon);
export const Bell = makeIcon(Notification01Icon);
export const Building = makeIcon(Building01Icon);
export const Building2 = makeIcon(Building02Icon);
export const Calculator = makeIcon(Calculator01Icon);
export const Calendar = makeIcon(Calendar03Icon);
export const CalendarCheck = makeIcon(CalendarCheckIn01Icon);
export const CalendarX2 = makeIcon(CalendarRemove01Icon);
export const Camera = makeIcon(Camera01Icon);
export const Check = makeIcon(Tick02Icon);
export const CheckCircle = makeIcon(CheckmarkCircle01Icon);
export const CheckCircle2 = makeIcon(CheckmarkCircle02Icon);
export const CheckIcon = makeIcon(Tick02Icon);
export const ChevronDown = makeIcon(ArrowDown01Icon);
export const ChevronDownIcon = makeIcon(ArrowDown01Icon);
export const ChevronLeft = makeIcon(ArrowLeft01Icon);
export const ChevronRight = makeIcon(ArrowRight01Icon);
export const ChevronUpIcon = makeIcon(ArrowUp01Icon);
export const Circle = makeIcon(CircleIcon);
export const Clock = makeIcon(Clock01Icon);
export const Copy = makeIcon(Copy01Icon);
export const CreditCard = makeIcon(CreditCardIcon);
export const DollarSign = makeIcon(DollarCircleIcon);
export const Download = makeIcon(Download01Icon);
export const Edit = makeIcon(Edit02Icon);
export const Edit3 = makeIcon(Edit03Icon);
export const ExternalLink = makeIcon(LinkSquare01Icon);
export const Eye = makeIcon(ViewIcon);
export const EyeOff = makeIcon(ViewOffIcon);
export const FileText = makeIcon(File01Icon);
export const Home = makeIcon(Home01Icon);
export const Hotel = makeIcon(Hotel01Icon);
export const IndianRupee = makeIcon(RupeeIcon);
export const Info = makeIcon(InformationCircleIcon);
export const LayoutDashboard = makeIcon(DashboardSquare01Icon);
export const Loader2 = makeIcon(Loading03Icon);
export const LogOut = makeIcon(Logout01Icon);
export const Mail = makeIcon(Mail01Icon);
export const MapPin = makeIcon(Location01Icon);
export const MoreHorizontal = makeIcon(MoreHorizontalIcon);
export const PanelLeft = makeIcon(SidebarLeftIcon);
export const Pencil = makeIcon(PencilEdit01Icon);
export const Percent = makeIcon(PercentIcon);
export const Phone = makeIcon(Call02Icon);
export const Plus = makeIcon(Add01Icon);
export const Printer = makeIcon(PrinterIcon);
export const Receipt = makeIcon(ReceiptDollarIcon);
export const RefreshCw = makeIcon(RefreshIcon);
export const RotateCcw = makeIcon(ArrowReloadHorizontalIcon);
export const RotateCw = makeIcon(RefreshIcon);
export const Save = makeIcon(FloppyDiskIcon);
export const Search = makeIcon(Search01Icon);
export const Send = makeIcon(SentIcon);
export const Settings = makeIcon(Settings01Icon);
export const Shield = makeIcon(Shield01Icon);
export const Smartphone = makeIcon(SmartPhone01Icon);
export const Snowflake = makeIcon(SnowIcon);
export const Star = makeIcon(StarIcon);
export const Trash2 = makeIcon(Delete02Icon);
export const TrendingUp = makeIcon(TradeUpIcon);
export const Upload = makeIcon(Upload01Icon);
export const User = makeIcon(UserIcon);
export const UserCheck = makeIcon(UserCheck01Icon);
export const UserPlus = makeIcon(UserAdd01Icon);
export const UserX = makeIcon(UserRemove01Icon);
export const Users = makeIcon(UserMultipleIcon);
export const Wallet = makeIcon(Wallet01Icon);
export const Wind = makeIcon(WindPowerIcon);
export const X = makeIcon(Cancel01Icon);
export const XCircle = makeIcon(CancelCircleIcon);
export const XIcon = makeIcon(Cancel01Icon);
