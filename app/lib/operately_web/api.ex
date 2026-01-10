defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  plug(OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount,
    except: [
      {:mutation, "add_first_company"},
      {:mutation, "join_company"},
      {:mutation, "create_email_activation_code"},
      {:mutation, "create_account"},
      {:mutation, "request_password_reset"},
      {:mutation, "reset_password"},

      # must be public to allow lookup by token
      {:query, "invitations/get_invitation"},
      {:query, "invitations/get_invite_link_by_token"}
    ]
  )

  use_types(OperatelyWeb.Api.Types)

  alias OperatelyWeb.Api.Queries, as: Q
  alias OperatelyWeb.Api.Mutations, as: M
  alias OperatelyWeb.Api.Subscriptions, as: S

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

  namespace(:goals) do
    query(:get_check_ins, Q.GetGoalCheckIns)
    query(:get_discussions, OperatelyWeb.Api.Goals.GetDiscussions)
    query(:parent_goal_search, OperatelyWeb.Api.Goals.ParentGoalSearch)

    mutation(:update_name, OperatelyWeb.Api.Goals.UpdateName)
    mutation(:update_description, OperatelyWeb.Api.Goals.UpdateDescription)
    mutation(:update_due_date, OperatelyWeb.Api.Goals.UpdateDueDate)
    mutation(:update_start_date, OperatelyWeb.Api.Goals.UpdateStartDate)
    mutation(:update_parent_goal, OperatelyWeb.Api.Goals.UpdateParentGoal)
    mutation(:update_space, OperatelyWeb.Api.Goals.UpdateSpace)

    mutation(:add_target, OperatelyWeb.Api.Goals.AddTarget)
    mutation(:delete_target, OperatelyWeb.Api.Goals.DeleteTarget)
    mutation(:update_target, OperatelyWeb.Api.Goals.UpdateTarget)
    mutation(:update_target_value, OperatelyWeb.Api.Goals.UpdateTargetValue)
    mutation(:update_target_index, OperatelyWeb.Api.Goals.UpdateTargetIndex)
    mutation(:update_champion, OperatelyWeb.Api.Goals.UpdateChampion)
    mutation(:update_reviewer, OperatelyWeb.Api.Goals.UpdateReviewer)
    mutation(:update_access_levels, OperatelyWeb.Api.Goals.UpdateAccessLevels)

    mutation(:add_check, OperatelyWeb.Api.GoalChecks.Add)
    mutation(:delete_check, OperatelyWeb.Api.GoalChecks.Delete)
    mutation(:update_check, OperatelyWeb.Api.GoalChecks.Update)
    mutation(:update_check_index, OperatelyWeb.Api.GoalChecks.UpdateIndex)
    mutation(:toggle_check, OperatelyWeb.Api.GoalChecks.Toggle)
  end

  namespace(:projects) do
    query(:parent_goal_search, OperatelyWeb.Api.Projects.ParentGoalSearch)
    query(:get_milestones, OperatelyWeb.Api.Projects.GetMilestones)
    query(:get_contributors, OperatelyWeb.Api.Projects.GetContributors)
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
    query(:list_tasks, OperatelyWeb.Api.ProjectMilestones.ListTasks)

    mutation(:update_title, OperatelyWeb.Api.ProjectMilestones.UpdateTitle)
    mutation(:update_kanban, OperatelyWeb.Api.ProjectMilestones.UpdateKanban)
    mutation(:update_due_date, OperatelyWeb.Api.ProjectMilestones.UpdateDueDate)
    mutation(:update_description, OperatelyWeb.Api.ProjectMilestones.UpdateDescription)
    mutation(:update_ordering, OperatelyWeb.Api.ProjectMilestones.UpdateOrdering)
    mutation(:delete, OperatelyWeb.Api.ProjectMilestones.Delete)
  end

  namespace(:tasks) do
    query(:list, OperatelyWeb.Api.Tasks.List)

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
    mutation(:edit, ProjectDiscussions.Edit)
  end

  namespace(:spaces) do
    query(:search, OperatelyWeb.Api.Spaces.Search)
    query(:list_members, OperatelyWeb.Api.Spaces.ListMembers)
    query(:list_tasks, OperatelyWeb.Api.Spaces.ListTasks)
    mutation(:update_task_statuses, OperatelyWeb.Api.Spaces.UpdateTaskStatuses)
    mutation(:update_kanban, OperatelyWeb.Api.Spaces.UpdateKanban)
    mutation(:update_tools, OperatelyWeb.Api.Spaces.UpdateTools)
  end

  namespace(:invitations) do
    # external: joining via invite link
    query(:get_invite_link_by_token, OperatelyWeb.Api.Invitations.GetInviteLinkByToken)
    mutation(:join_company_via_invite_link, OperatelyWeb.Api.Invitations.JoinCompanyViaInviteLink)

    # internal: managing invite links and invitations
    mutation(:get_company_invite_link, OperatelyWeb.Api.Invitations.GetCompanyInviteLink)
    mutation(:update_company_invite_link, OperatelyWeb.Api.Invitations.UpdateCompanyInviteLink)
    mutation(:reset_company_invite_link, OperatelyWeb.Api.Invitations.ResetCompanyInviteLink)

    # single user invitations
    query(:get_invitation, Q.GetInvitation)
    mutation(:new_invitation_token, M.NewInvitationToken)
  end

  query(:get_account, Q.GetAccount)
  query(:get_activities, Q.GetActivities)
  query(:get_activity, Q.GetActivity)
  query(:get_assignments_count, Q.GetAssignmentsCount)
  query(:get_assignments, Q.GetAssignments)
  query(:get_comments, Q.GetComments)
  query(:get_companies, Q.GetCompanies)
  query(:get_company, Q.GetCompany)
  query(:get_discussion, Q.GetDiscussion)
  query(:get_discussions, Q.GetDiscussions)
  query(:get_goal, Q.GetGoal)
  query(:get_goal_progress_update, Q.GetGoalProgressUpdate)
  query(:get_goals, Q.GetGoals)
  query(:get_key_resource, Q.GetKeyResource)
  query(:get_me, Q.GetMe)
  query(:get_milestone, Q.GetMilestone)
  query(:get_notifications, Q.GetNotifications)
  query(:get_people, Q.GetPeople)
  query(:get_person, Q.GetPerson)
  query(:get_project, Q.GetProject)
  query(:get_project_check_in, Q.GetProjectCheckIn)
  query(:get_project_check_ins, Q.GetProjectCheckIns)
  query(:get_projects, Q.GetProjects)
  query(:get_project_contributor, Q.GetProjectContributor)
  query(:get_project_retrospective, Q.GetProjectRetrospective)
  query(:get_space, Q.GetSpace)
  query(:get_spaces, Q.GetSpaces)
  query(:get_task, Q.GetTask)
  query(:get_tasks, Q.GetTasks)
  query(:get_binded_people, Q.GetBindedPeople)
  query(:get_unread_notification_count, Q.GetUnreadNotificationCount)
  query(:get_resource_hub, Q.GetResourceHub)
  query(:get_resource_hub_document, Q.GetResourceHubDocument)
  query(:get_resource_hub_file, Q.GetResourceHubFile)
  query(:get_resource_hub_folder, Q.GetResourceHubFolder)
  query(:get_resource_hub_link, Q.GetResourceHubLink)
  query(:list_goal_contributors, Q.ListGoalContributors)
  query(:list_resource_hub_nodes, Q.ListResourceHubNodes)
  query(:list_space_tools, Q.ListSpaceTools)
  query(:search_people, Q.SearchPeople)
  query(:search_potential_space_members, Q.SearchPotentialSpaceMembers)
  query(:search_project_contributor_candidates, Q.SearchProjectContributorCandidates)
  query(:list_possible_managers, Q.ListPossibleManagers)
  query(:get_work_map, Q.GetWorkMap)
  query(:get_flat_work_map, Q.GetFlatWorkMap)
  query(:global_search, Q.GlobalSearch)
  query(:list_task_assignable_people, Q.ListTaskAssignablePeople)

  mutation(:delete_company, M.DeleteCompany)
  mutation(:archive_message, M.ArchiveMessage)
  mutation(:restore_company_member, M.RestoreCompanyMember)
  mutation(:add_company, M.AddCompany)
  mutation(:add_company_admins, M.AddCompanyAdmins)
  mutation(:add_company_member, M.AddCompanyMember)
  mutation(:add_company_owners, M.AddCompanyOwners)
  mutation(:add_company_trusted_email_domain, M.AddCompanyTrustedEmailDomain)
  mutation(:add_first_company, M.AddFirstCompany)
  mutation(:complete_company_setup, M.CompleteCompanySetup)
  mutation(:add_space_members, M.AddSpaceMembers)
  mutation(:add_key_resource, M.AddKeyResource)
  mutation(:add_project_contributor, M.AddProjectContributor)
  mutation(:add_project_contributors, M.AddProjectContributors)
  mutation(:add_reaction, M.AddReaction)
  mutation(:remove_reaction, M.RemoveReaction)

  mutation(:copy_resource_hub_folder, M.CopyResourceHubFolder)
  mutation(:create_account, M.CreateAccount)
  mutation(:create_blob, M.CreateBlob)
  mutation(:create_avatar_blob, M.CreateAvatarBlob)
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
  mutation(:create_email_activation_code, M.CreateEmailActivationCode)
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
  mutation(:edit_discussion, M.EditDiscussion)
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
  mutation(:join_company, M.JoinCompany)
  mutation(:mark_all_notifications_as_read, M.MarkAllNotificationsAsRead)
  mutation(:mark_notification_as_read, M.MarkNotificationAsRead)
  mutation(:mark_notifications_as_read, M.MarkNotificationsAsRead)
  mutation(:move_project_to_space, M.MoveProjectToSpace)
  mutation(:pause_project, M.PauseProject)
  mutation(:post_discussion, M.PostDiscussion)
  mutation(:publish_discussion, M.PublishDiscussion)
  mutation(:post_goal_progress_update, M.PostGoalProgressUpdate)
  mutation(:post_milestone_comment, M.PostMilestoneComment)
  mutation(:post_project_check_in, M.PostProjectCheckIn)

  mutation(:acknowledge_goal_progress_update, M.AcknowledgeGoalProgressUpdate)
  mutation(:acknowledge_project_check_in, M.AcknowledgeProjectCheckIn)
  mutation(:close_goal, M.CloseGoal)
  mutation(:close_project, M.CloseProject)

  mutation(:request_password_reset, M.RequestPasswordReset)
  mutation(:reset_password, M.ResetPassword)
  mutation(:change_password, M.ChangePassword)

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
