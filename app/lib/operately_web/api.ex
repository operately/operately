defmodule OperatelyWeb.Api do
  defmacro common_endpoints do
    quote do
      alias OperatelyWeb.Api.Queries, as: Q
      alias OperatelyWeb.Api.Mutations, as: M
      alias OperatelyWeb.Api.Subscriptions, as: S

      namespace(:goals) do
        query(:get, OperatelyWeb.Api.Goals.Get)
        query(:list, OperatelyWeb.Api.Goals.List)
        query(:list_access_members, OperatelyWeb.Api.Goals.ListAccessMembers)
        query(:list_check_ins, Q.ListGoalCheckIns)
        query(:list_contributors, OperatelyWeb.Api.Goals.ListContributors)
        query(:list_discussions, OperatelyWeb.Api.Goals.ListDiscussions)
        query(:search_parent_goal, OperatelyWeb.Api.Goals.SearchParentGoal)

        mutation(:create_access_members, OperatelyWeb.Api.Goals.CreateAccessMembers)
        mutation(:update_access_member, OperatelyWeb.Api.Goals.UpdateAccessMember)
        mutation(:delete_access_member, OperatelyWeb.Api.Goals.DeleteAccessMember)
        mutation(:update_name, OperatelyWeb.Api.Goals.UpdateName)
        mutation(:update_description, OperatelyWeb.Api.Goals.UpdateDescription)
        mutation(:update_due_date, OperatelyWeb.Api.Goals.UpdateDueDate)
        mutation(:update_start_date, OperatelyWeb.Api.Goals.UpdateStartDate)
        mutation(:update_parent_goal, OperatelyWeb.Api.Goals.UpdateParentGoal)
        mutation(:update_space, OperatelyWeb.Api.Goals.UpdateSpace)

        mutation(:create_target, OperatelyWeb.Api.Goals.CreateTarget)
        mutation(:delete_target, OperatelyWeb.Api.Goals.DeleteTarget)
        mutation(:update_target, OperatelyWeb.Api.Goals.UpdateTarget)
        mutation(:update_target_value, OperatelyWeb.Api.Goals.UpdateTargetValue)
        mutation(:update_target_index, OperatelyWeb.Api.Goals.UpdateTargetIndex)
        mutation(:update_champion, OperatelyWeb.Api.Goals.UpdateChampion)
        mutation(:update_reviewer, OperatelyWeb.Api.Goals.UpdateReviewer)
        mutation(:update_access_levels, OperatelyWeb.Api.Goals.UpdateAccessLevels)

        mutation(:create_check, OperatelyWeb.Api.GoalChecks.Create)
        mutation(:delete_check, OperatelyWeb.Api.GoalChecks.Delete)
        mutation(:update_check, OperatelyWeb.Api.GoalChecks.Update)
        mutation(:update_check_index, OperatelyWeb.Api.GoalChecks.UpdateIndex)
        mutation(:toggle_check, OperatelyWeb.Api.GoalChecks.Toggle)
      end

      namespace(:projects) do
        query(:get, OperatelyWeb.Api.Projects.Get)
        query(:list, OperatelyWeb.Api.Projects.List)
        query(:search_parent_goal, OperatelyWeb.Api.Projects.SearchParentGoal)
        query(:search_potential_contributors, OperatelyWeb.Api.Projects.SearchPotentialContributors)
        query(:search, OperatelyWeb.Api.Projects.Search)
        query(:list_milestones, OperatelyWeb.Api.Projects.ListMilestones)
        query(:list_contributors, OperatelyWeb.Api.Projects.ListContributors)
        query(:count_children, OperatelyWeb.Api.Projects.CountChildren)

        mutation(:update_due_date, OperatelyWeb.Api.Projects.UpdateDueDate)
        mutation(:update_start_date, OperatelyWeb.Api.Projects.UpdateStartDate)
        mutation(:update_champion, OperatelyWeb.Api.Projects.UpdateChampion)
        mutation(:update_reviewer, OperatelyWeb.Api.Projects.UpdateReviewer)
        mutation(:update_parent_goal, OperatelyWeb.Api.Projects.UpdateParentGoal)
        mutation(:create_milestone, OperatelyWeb.Api.Projects.CreateMilestone)
        mutation(:update_milestone, OperatelyWeb.Api.Projects.UpdateMilestone)
        mutation(:update_task_statuses, OperatelyWeb.Api.Projects.UpdateTaskStatuses)
        mutation(:update_kanban, OperatelyWeb.Api.Projects.UpdateKanban)
        mutation(:delete, OperatelyWeb.Api.Projects.DeleteProject)
      end

      namespace(:project_milestones) do
        query(:get, OperatelyWeb.Api.ProjectMilestones.Get)
        query(:list_tasks, OperatelyWeb.Api.ProjectMilestones.ListTasks)

        mutation(:update_title, OperatelyWeb.Api.ProjectMilestones.UpdateTitle)
        mutation(:update_kanban, OperatelyWeb.Api.ProjectMilestones.UpdateKanban)
        mutation(:update_due_date, OperatelyWeb.Api.ProjectMilestones.UpdateDueDate)
        mutation(:update_description, OperatelyWeb.Api.ProjectMilestones.UpdateDescription)
        mutation(:update_ordering, OperatelyWeb.Api.ProjectMilestones.UpdateOrdering)
        mutation(:delete, OperatelyWeb.Api.ProjectMilestones.Delete)
      end

      namespace(:tasks) do
        query(:get, OperatelyWeb.Api.Tasks.Get)
        query(:list, OperatelyWeb.Api.Tasks.List)
        query(:list_potential_assignees, OperatelyWeb.Api.Tasks.ListPotentialAssignees)

        mutation(:create, OperatelyWeb.Api.Tasks.Create)
        mutation(:delete, OperatelyWeb.Api.Tasks.Delete)
        mutation(:update_name, OperatelyWeb.Api.Tasks.UpdateName)
        mutation(:update_status, OperatelyWeb.Api.Tasks.UpdateStatus)
        mutation(:update_due_date, OperatelyWeb.Api.Tasks.UpdateDueDate)
        mutation(:update_assignee, OperatelyWeb.Api.Tasks.UpdateAssignee)
        mutation(:update_milestone, OperatelyWeb.Api.Tasks.UpdateMilestone)
        mutation(:update_milestone_and_ordering, OperatelyWeb.Api.Tasks.UpdateMilestoneAndOrdering)
        mutation(:update_description, OperatelyWeb.Api.Tasks.UpdateDescription)
      end

      namespace(:project_discussions) do
        alias OperatelyWeb.Api.ProjectDiscussions

        query(:get, ProjectDiscussions.Get)
        query(:list, ProjectDiscussions.List)

        mutation(:create, ProjectDiscussions.Create)
        mutation(:update, ProjectDiscussions.Update)
      end

      namespace(:space_discussions) do
        alias OperatelyWeb.Api.SpaceDiscussions

        query(:get, SpaceDiscussions.Get)
        query(:list, SpaceDiscussions.List)

        mutation(:update, SpaceDiscussions.Update)
        mutation(:create, SpaceDiscussions.Create)
        mutation(:publish, SpaceDiscussions.Publish)
      end

      namespace(:spaces) do
        query(:get, OperatelyWeb.Api.Spaces.Get)
        query(:list, OperatelyWeb.Api.Spaces.List)
        query(:search, OperatelyWeb.Api.Spaces.Search)
        query(:search_potential_members, OperatelyWeb.Api.Spaces.SearchPotentialMembers)
        query(:count_by_access_level, OperatelyWeb.Api.Spaces.CountByAccessLevel)
        query(:list_members, OperatelyWeb.Api.Spaces.ListMembers)
        query(:list_tasks, OperatelyWeb.Api.Spaces.ListTasks)
        query(:list_tools, OperatelyWeb.Api.Spaces.ListTools)
        mutation(:update_task_statuses, OperatelyWeb.Api.Spaces.UpdateTaskStatuses)
        mutation(:update_kanban, OperatelyWeb.Api.Spaces.UpdateKanban)
        mutation(:update_tools, OperatelyWeb.Api.Spaces.UpdateTools)
      end

      query(:get_account, Q.GetAccount)
      query(:get_activities, Q.GetActivities)
      query(:get_activity, Q.GetActivity)
      query(:get_assignments_count, Q.GetAssignmentsCount)
      query(:get_assignments, Q.GetAssignments)
      query(:get_comments, Q.GetComments)
      query(:get_companies, Q.GetCompanies)
      query(:get_company, Q.GetCompany)
      query(:get_goal_progress_update, Q.GetGoalProgressUpdate)
      query(:get_key_resource, Q.GetKeyResource)
      query(:get_me, Q.GetMe)
      query(:get_notifications, Q.GetNotifications)
      query(:get_people, Q.GetPeople)
      query(:get_person, Q.GetPerson)
      query(:get_project_check_in, Q.GetProjectCheckIn)
      query(:get_project_check_ins, Q.GetProjectCheckIns)
      query(:get_project_contributor, Q.GetProjectContributor)
      query(:get_project_retrospective, Q.GetProjectRetrospective)
      query(:get_binded_people, Q.GetBindedPeople)
      query(:get_unread_notification_count, Q.GetUnreadNotificationCount)
      query(:get_resource_hub, Q.GetResourceHub)
      query(:get_resource_hub_document, Q.GetResourceHubDocument)
      query(:get_resource_hub_file, Q.GetResourceHubFile)
      query(:get_resource_hub_folder, Q.GetResourceHubFolder)
      query(:get_resource_hub_link, Q.GetResourceHubLink)
      query(:list_resource_hub_nodes, Q.ListResourceHubNodes)
      query(:search_people, Q.SearchPeople)
      query(:list_possible_managers, Q.ListPossibleManagers)
      query(:get_work_map, Q.GetWorkMap)
      query(:get_flat_work_map, Q.GetFlatWorkMap)
      query(:global_search, Q.GlobalSearch)
      query(:is_subscribed_to_resource, Q.IsSubscribedToResource)

      mutation(:archive_message, M.ArchiveMessage)
      mutation(:restore_company_member, M.RestoreCompanyMember)
      mutation(:convert_company_member_to_guest, M.ConvertCompanyMemberToGuest)
      mutation(:add_company, M.AddCompany)
      mutation(:add_company_admins, M.AddCompanyAdmins)
      mutation(:add_company_member, M.AddCompanyMember)
      mutation(:edit_company_members_permissions, M.EditCompanyMembersPermissions)
      mutation(:invite_guest, M.InviteGuest)
      mutation(:grant_resource_access, M.GrantResourceAccess)
      mutation(:add_space_members, M.AddSpaceMembers)
      mutation(:add_key_resource, M.AddKeyResource)
      mutation(:add_project_contributor, M.AddProjectContributor)
      mutation(:add_project_contributors, M.AddProjectContributors)
      mutation(:add_reaction, M.AddReaction)
      mutation(:remove_reaction, M.RemoveReaction)

      mutation(:copy_resource_hub_folder, M.CopyResourceHubFolder)
      mutation(:create_comment, M.CreateComment)
      mutation(:create_goal, M.CreateGoal)
      mutation(:create_goal_discussion, M.CreateGoalDiscussion)
      mutation(:create_space, M.CreateSpace)
      mutation(:create_project, M.CreateProject)
      mutation(:create_resource_hub, M.CreateResourceHub)
      mutation(:create_resource_hub_document, M.CreateResourceHubDocument)
      mutation(:create_resource_hub_file, M.CreateResourceHubFile)
      mutation(:create_resource_hub_folder, M.CreateResourceHubFolder)
      mutation(:create_resource_hub_link, M.CreateResourceHubLink)
      mutation(:publish_resource_hub_document, M.PublishResourceHubDocument)

      mutation(:delete_goal, M.DeleteGoal)
      mutation(:delete_comment, M.DeleteComment)
      mutation(:delete_resource_hub_document, M.DeleteResourceHubDocument)
      mutation(:delete_resource_hub_file, M.DeleteResourceHubFile)
      mutation(:delete_resource_hub_folder, M.DeleteResourceHubFolder)
      mutation(:delete_resource_hub_link, M.DeleteResourceHubLink)
      mutation(:delete_space, M.DeleteSpace)

      mutation(:remove_company_admin, M.RemoveCompanyAdmin)
      mutation(:remove_company_member, M.RemoveCompanyMember)
      mutation(:remove_company_trusted_email_domain, M.RemoveCompanyTrustedEmailDomain)
      mutation(:remove_group_member, M.RemoveGroupMember)
      mutation(:remove_key_resource, M.RemoveKeyResource)
      mutation(:remove_project_contributor, M.RemoveProjectContributor)
      mutation(:remove_company_owner, M.RemoveCompanyOwner)

      mutation(:edit_company, M.EditCompany)
      mutation(:edit_comment, M.EditComment)
      mutation(:edit_goal_discussion, M.EditGoalDiscussion)
      mutation(:edit_goal_progress_update, M.EditGoalProgressUpdate)
      mutation(:edit_space, M.EditSpace)
      mutation(:edit_key_resource, M.EditKeyResource)
      mutation(:edit_project_check_in, M.EditProjectCheckIn)
      mutation(:edit_project_name, M.EditProjectName)
      mutation(:edit_project_permissions, M.EditProjectPermissions)
      mutation(:edit_project_retrospective, M.EditProjectRetrospective)
      mutation(:edit_resource_hub_document, M.EditResourceHubDocument)
      mutation(:edit_resource_hub_file, M.EditResourceHubFile)
      mutation(:edit_resource_hub_link, M.EditResourceHubLink)
      mutation(:edit_space_members_permissions, M.EditSpaceMembersPermissions)
      mutation(:edit_space_permissions, M.EditSpacePermissions)
      mutation(:edit_subscriptions_list, M.EditSubscriptionsList)
      mutation(:edit_parent_folder_in_resource_hub, M.EditParentFolderInResourceHub)
      mutation(:rename_resource_hub_folder, M.RenameResourceHubFolder)

      mutation(:join_space, M.JoinSpace)
      mutation(:mark_all_notifications_as_read, M.MarkAllNotificationsAsRead)
      mutation(:mark_notification_as_read, M.MarkNotificationAsRead)
      mutation(:mark_notifications_as_read, M.MarkNotificationsAsRead)
      mutation(:move_project_to_space, M.MoveProjectToSpace)
      mutation(:move_task, M.MoveTask)
      mutation(:pause_project, M.PauseProject)
      mutation(:post_goal_progress_update, M.PostGoalProgressUpdate)
      mutation(:post_milestone_comment, M.PostMilestoneComment)
      mutation(:post_project_check_in, M.PostProjectCheckIn)

      mutation(:acknowledge_goal_progress_update, M.AcknowledgeGoalProgressUpdate)
      mutation(:acknowledge_project_check_in, M.AcknowledgeProjectCheckIn)
      mutation(:close_goal, M.CloseGoal)
      mutation(:close_project, M.CloseProject)

      mutation(:change_goal_parent, M.ChangeGoalParent)

      mutation(:reopen_goal, M.ReopenGoal)
      mutation(:resume_project, M.ResumeProject)
      mutation(:subscribe_to_notifications, M.SubscribeToNotifications)
      mutation(:unsubscribe_from_notifications, M.UnsubscribeFromNotifications)
      mutation(:update_profile, M.UpdateProfile)
      mutation(:update_theme, M.UpdateTheme)
      mutation(:update_profile_picture, M.UpdateProfilePicture)
      mutation(:update_project_contributor, M.UpdateProjectContributor)
      mutation(:update_project_description, M.UpdateProjectDescription)

      subscription(:assignments_count, S.AssignmentsCount)
      subscription(:reload_comments, S.ReloadComments)
      subscription(:unread_notifications_count, S.UnreadNotificationsCount)
      subscription(:profile_updated, S.ProfileUpdated)
      subscription(:new_agent_message, S.NewAgentMessage)
    end
  end

  defmacro internal_endpoints do
    quote do
      common_endpoints()

      mutation(:create_blob, OperatelyWeb.Api.Mutations.CreateBlob)
      mutation(:create_avatar_blob, OperatelyWeb.Api.Mutations.CreateAvatarBlob)
      mutation(:delete_company, OperatelyWeb.Api.Mutations.DeleteCompany)
      mutation(:add_company_owners, OperatelyWeb.Api.Mutations.AddCompanyOwners)
      mutation(:add_company_trusted_email_domain, OperatelyWeb.Api.Mutations.AddCompanyTrustedEmailDomain)
      mutation(:add_first_company, OperatelyWeb.Api.Mutations.AddFirstCompany)
      mutation(:complete_company_setup, OperatelyWeb.Api.Mutations.CompleteCompanySetup)
      mutation(:request_password_reset, OperatelyWeb.Api.Mutations.RequestPasswordReset)
      mutation(:reset_password, OperatelyWeb.Api.Mutations.ResetPassword)
      mutation(:change_password, OperatelyWeb.Api.Mutations.ChangePassword)
      mutation(:create_account, OperatelyWeb.Api.Mutations.CreateAccount)
      mutation(:create_email_activation_code, OperatelyWeb.Api.Mutations.CreateEmailActivationCode)
      mutation(:join_company, OperatelyWeb.Api.Mutations.JoinCompany)

      query(:get_theme, OperatelyWeb.Api.Queries.GetTheme)

      namespace(:ai) do
        query(:prompt, OperatelyWeb.Api.Ai.Prompt)
        query(:get_agent, OperatelyWeb.Api.Ai.GetAgent)
        query(:get_agent_run, OperatelyWeb.Api.Ai.GetAgentRun)
        query(:list_agents, OperatelyWeb.Api.Ai.ListAgents)
        query(:list_agent_runs, OperatelyWeb.Api.Ai.ListAgentRuns)
        mutation(:add_agent, OperatelyWeb.Api.Ai.AddAgent)
        mutation(:edit_agent_definition, OperatelyWeb.Api.Ai.EditAgentDefinition)
        mutation(:edit_agent_sandbox_mode, OperatelyWeb.Api.Ai.EditAgentSandboxMode)
        mutation(:run_agent, OperatelyWeb.Api.Ai.RunAgent)
        mutation(:edit_agent_task_execution_instructions, OperatelyWeb.Api.Ai.EditAgentTaskExecutionInstructions)
        mutation(:edit_agent_planning_instructions, OperatelyWeb.Api.Ai.EditAgentPlanningInstructions)
        mutation(:edit_agent_daily_run, OperatelyWeb.Api.Ai.EditAgentDailyRun)
        mutation(:edit_agent_verbosity, OperatelyWeb.Api.Ai.EditAgentVerbosity)
        mutation(:edit_agent_provider, OperatelyWeb.Api.Ai.EditAgentProvider)

        query(:get_conversation_messages, OperatelyWeb.Api.Ai.GetConversationMessages)
        query(:get_conversations, OperatelyWeb.Api.Ai.GetConversations)
        mutation(:create_conversation, OperatelyWeb.Api.Ai.CreateConversation)
        mutation(:send_message, OperatelyWeb.Api.Ai.SendMessage)
      end

      namespace(:invitations) do
        # invitation endpoints are internal-only
        query(:get_invite_link_by_token, OperatelyWeb.Api.Invitations.GetInviteLinkByToken)
        mutation(:join_company_via_invite_link, OperatelyWeb.Api.Invitations.JoinCompanyViaInviteLink)

        # internal: managing invite links and invitations
        mutation(:get_company_invite_link, OperatelyWeb.Api.Invitations.GetCompanyInviteLink)
        mutation(:update_company_invite_link, OperatelyWeb.Api.Invitations.UpdateCompanyInviteLink)
        mutation(:reset_company_invite_link, OperatelyWeb.Api.Invitations.ResetCompanyInviteLink)

        # single user invitations
        query(:get_invitation, OperatelyWeb.Api.Queries.GetInvitation)
        mutation(:new_invitation_token, OperatelyWeb.Api.Mutations.NewInvitationToken)
      end

      namespace(:api_tokens) do
        query(:list, OperatelyWeb.Api.ApiTokens.List)
        mutation(:create, OperatelyWeb.Api.ApiTokens.Create)
        mutation(:set_read_only, OperatelyWeb.Api.ApiTokens.SetReadOnly)
        mutation(:update_name, OperatelyWeb.Api.ApiTokens.UpdateName)
        mutation(:delete, OperatelyWeb.Api.ApiTokens.Delete)
      end
    end
  end

  defmacro external_endpoints do
    quote do
      common_endpoints()
    end
  end
end
