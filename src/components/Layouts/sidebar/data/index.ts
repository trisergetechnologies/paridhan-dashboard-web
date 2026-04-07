import type { ComponentType, SVGProps } from "react";
import * as Icons from "../icons";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavSubItem = { title: string; url: string };

export type NavItem =
  | {
      title: string;
      icon: NavIcon;
      url: string;
      items: [];
    }
  | {
      title: string;
      icon: NavIcon;
      items: NavSubItem[];
    };

export type NavSection = { label: string; items: NavItem[] };

export function buildNavData(isPlatformAdmin: boolean): NavSection[] {
  if (isPlatformAdmin) {
    return [
      {
        label: "MAIN MENU",
        items: [
          {
            title: "Dashboard",
            icon: Icons.HomeIcon,
            url: "/atlas",
            items: [],
          },
          {
            title: "Sellers",
            icon: Icons.User,
            url: "/atlas/sellers",
            items: [],
          },
          {
            title: "Customers",
            icon: Icons.User,
            url: "/atlas/customers",
            items: [],
          },
          {
            title: "Categories",
            icon: Icons.PieChart,
            url: "/atlas/categories",
            items: [],
          },
          {
            title: "Orders",
            icon: Icons.Calendar,
            url: "/atlas/orders",
            items: [],
          },
        ],
      },
      {
        label: "ACCOUNT",
        items: [
          {
            title: "Settings",
            icon: Icons.SettingsIcon,
            items: [
              { title: "Website", url: "/atlas/settings/website" },
              { title: "Change password", url: "/atlas/settings/password" },
            ],
          },
        ],
      },
    ];
  }

  return [
    {
      label: "MAIN MENU",
      items: [
        {
          title: "Dashboard",
          icon: Icons.HomeIcon,
          url: "/atlas",
          items: [],
        },
        {
          title: "My products",
          icon: Icons.Table,
          url: "/atlas/products",
          items: [],
        },
        {
          title: "My orders",
          icon: Icons.Calendar,
          url: "/atlas/my-orders",
          items: [],
        },
      ],
    },
    {
      label: "ACCOUNT",
      items: [
        {
          title: "Settings",
          icon: Icons.SettingsIcon,
          items: [{ title: "Change password", url: "/atlas/settings/password" }],
        },
      ],
    },
  ];
}
