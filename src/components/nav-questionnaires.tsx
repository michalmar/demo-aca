"use client"

import {
  ClipboardList,
  GraduationCap,
  MoreHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { QuestionnaireType } from "@/data/questionnaire"

const questionnaireTypeIconMap: Record<QuestionnaireType, LucideIcon> = {
  question: ClipboardList,
  test: GraduationCap,
  flashcard: Sparkles,
}

interface QuestionnaireItem {
  id: string
  title: string
  type: QuestionnaireType
}

export function NavQuestionnaires({
  questionnaires,
  activeId,
  onSelect,
}: {
  questionnaires: QuestionnaireItem[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Questionnaires</SidebarGroupLabel>
      <SidebarMenu>
        {questionnaires.map((item) => {
          const Icon = questionnaireTypeIconMap[item.type] ?? ClipboardList
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onSelect(item.id)}
                isActive={activeId === item.id}
                tooltip={item.title}
              >
                <Icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
        {questionnaires.length === 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <MoreHorizontal />
              <span>No questionnaires</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
