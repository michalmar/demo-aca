"use client"

import * as React from "react"

import { AppHeader } from "@/components/app-header"
import { NavQuestionnaires } from "@/components/nav-questionnaires"
import { NavMenus, type MenuView } from "@/components/nav-menus"
import { NavFooter } from "@/components/nav-footer"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import type { QuestionnaireType } from "@/data/questionnaire"

const userData = {
  name: "Student",
  email: "student@example.com",
}

interface QuestionnaireItem {
  id: string
  title: string
  type: QuestionnaireType
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  questionnaires: QuestionnaireItem[]
  activeQuestionnaireId: string
  onQuestionnaireSelect: (id: string) => void
  activeView: MenuView
  onViewChange: (view: MenuView) => void
}

export function AppSidebar({
  questionnaires,
  activeQuestionnaireId,
  onQuestionnaireSelect,
  activeView,
  onViewChange,
  ...props
}: AppSidebarProps) {
  const handleQuestionnaireSelect = (id: string) => {
    onQuestionnaireSelect(id)
    onViewChange("questionnaire")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavQuestionnaires
          questionnaires={questionnaires}
          activeId={activeView === "questionnaire" ? activeQuestionnaireId : ""}
          onSelect={handleQuestionnaireSelect}
        />
        <SidebarSeparator />
        <NavMenus activeView={activeView} onViewChange={onViewChange} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
