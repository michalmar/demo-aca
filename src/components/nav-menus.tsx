"use client"

import {
  HelpCircle,
  List,
  MessageSquare,
  Settings,
  Upload,
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type MenuView = "questionnaire" | "upload" | "responses" | "questionnaires-list" | "settings" | "help"

interface MenuItem {
  title: string
  view: MenuView
  icon: LucideIcon
}

const menuItems: MenuItem[] = [
  {
    title: "Upload Topic",
    view: "upload",
    icon: Upload,
  },
  {
    title: "Questionnaires",
    view: "questionnaires-list",
    icon: List,
  },
  {
    title: "Responses",
    view: "responses",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    view: "settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    view: "help",
    icon: HelpCircle,
  },
]

export function NavMenus({
  activeView,
  onViewChange,
}: {
  activeView: MenuView
  onViewChange: (view: MenuView) => void
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Menus</SidebarGroupLabel>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.view}>
            <SidebarMenuButton
              onClick={() => onViewChange(item.view)}
              isActive={activeView === item.view}
              tooltip={item.title}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
