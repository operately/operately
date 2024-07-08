defmodule OperatelyWeb.Api do
  use TurboConnect.Api

  plug OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount, except: [
    {:mutation, :add_first_company}
  ]

  use_types OperatelyWeb.Api.Types

  query :get_activities, OperatelyWeb.Api.Queries.GetActivities
  query :get_activity, OperatelyWeb.Api.Queries.GetActivity
  query :get_comments, OperatelyWeb.Api.Queries.GetComments
  query :get_company, OperatelyWeb.Api.Queries.GetCompany
  query :get_companies, OperatelyWeb.Api.Queries.GetCompanies
  query :get_discussion, OperatelyWeb.Api.Queries.GetDiscussion
  query :get_discussions, OperatelyWeb.Api.Queries.GetDiscussions
  query :get_goal, OperatelyWeb.Api.Queries.GetGoal
  query :get_goal_check_in, OperatelyWeb.Api.Queries.GetGoalCheckIn
  query :get_goal_check_ins, OperatelyWeb.Api.Queries.GetGoalCheckIns
  query :get_goals, OperatelyWeb.Api.Queries.GetGoals
  query :get_invitation, OperatelyWeb.Api.Queries.GetInvitation
  query :get_key_resource, OperatelyWeb.Api.Queries.GetKeyResource
  query :get_me, OperatelyWeb.Api.Queries.GetMe
  query :get_milestone, OperatelyWeb.Api.Queries.GetMilestone
  query :get_notifications, OperatelyWeb.Api.Queries.GetNotifications
  query :get_people, OperatelyWeb.Api.Queries.GetPeople
  query :get_person, OperatelyWeb.Api.Queries.GetPerson
  query :get_project, OperatelyWeb.Api.Queries.GetProject
  query :get_project_check_in, OperatelyWeb.Api.Queries.GetProjectCheckIn
  query :get_project_check_ins, OperatelyWeb.Api.Queries.GetProjectCheckIns
  query :get_projects, OperatelyWeb.Api.Queries.GetProjects
  query :get_space, OperatelyWeb.Api.Queries.GetSpace
  query :get_spaces, OperatelyWeb.Api.Queries.GetSpaces
  query :get_task, OperatelyWeb.Api.Queries.GetTask
  query :get_tasks, OperatelyWeb.Api.Queries.GetTasks
  query :get_unread_notification_count, OperatelyWeb.Api.Queries.GetUnreadNotificationCount
  query :search_people, OperatelyWeb.Api.Queries.SearchPeople
  query :search_project_contributor_candidates, OperatelyWeb.Api.Queries.SearchProjectContributorCandidates
  query :search_potential_space_members, OperatelyWeb.Api.Queries.SearchPotentialSpaceMembers

  mutation :acknowledge_goal_check_in, OperatelyWeb.Api.Mutations.AcknowledgeGoalCheckIn
  mutation :acknowledge_project_check_in, OperatelyWeb.Api.Mutations.AcknowledgeProjectCheckIn
  mutation :add_company_admins, OperatelyWeb.Api.Mutations.AddCompanyAdmins
  mutation :add_company_member, OperatelyWeb.Api.Mutations.AddCompanyMember
  mutation :add_company_trusted_email_domain, OperatelyWeb.Api.Mutations.AddCompanyTrustedEmailDomain
  mutation :add_first_company, OperatelyWeb.Api.Mutations.AddFirstCompany
  mutation :add_group_members, OperatelyWeb.Api.Mutations.AddGroupMembers
  mutation :add_key_resource, OperatelyWeb.Api.Mutations.AddKeyResource
  mutation :add_project_contributor, OperatelyWeb.Api.Mutations.AddProjectContributor
  mutation :add_reaction, OperatelyWeb.Api.Mutations.AddReaction
  mutation :archive_goal, OperatelyWeb.Api.Mutations.ArchiveGoal
  mutation :archive_project, OperatelyWeb.Api.Mutations.ArchiveProject
  mutation :change_goal_parent, OperatelyWeb.Api.Mutations.ChangeGoalParent
  mutation :change_password_first_time, OperatelyWeb.Api.Mutations.ChangePasswordFirstTime
  mutation :change_task_description, OperatelyWeb.Api.Mutations.ChangeTaskDescription
  mutation :close_goal, OperatelyWeb.Api.Mutations.CloseGoal
  mutation :close_project, OperatelyWeb.Api.Mutations.CloseProject
  mutation :connect_goal_to_project, OperatelyWeb.Api.Mutations.ConnectGoalToProject
  mutation :create_blob, OperatelyWeb.Api.Mutations.CreateBlob
  mutation :create_comment, OperatelyWeb.Api.Mutations.CreateComment
  mutation :create_goal, OperatelyWeb.Api.Mutations.CreateGoal
  mutation :edit_goal, OperatelyWeb.Api.Mutations.EditGoal
  mutation :create_goal_discussion, OperatelyWeb.Api.Mutations.CreateGoalDiscussion
  mutation :create_goal_update, OperatelyWeb.Api.Mutations.CreateGoalUpdate
  mutation :create_group, OperatelyWeb.Api.Mutations.CreateGroup
  mutation :create_project, OperatelyWeb.Api.Mutations.CreateProject
  mutation :create_task, OperatelyWeb.Api.Mutations.CreateTask
  mutation :disconnect_goal_from_project, OperatelyWeb.Api.Mutations.DisconnectGoalFromProject
  mutation :edit_comment, OperatelyWeb.Api.Mutations.EditComment
  mutation :edit_discussion, OperatelyWeb.Api.Mutations.EditDiscussion
  mutation :edit_goal_discussion, OperatelyWeb.Api.Mutations.EditGoalDiscussion
  mutation :edit_goal_timeframe, OperatelyWeb.Api.Mutations.EditGoalTimeframe
  mutation :edit_goal_update, OperatelyWeb.Api.Mutations.EditGoalUpdate
  mutation :edit_group, OperatelyWeb.Api.Mutations.EditGroup
  mutation :edit_project_name, OperatelyWeb.Api.Mutations.EditProjectName
  mutation :edit_project_timeline, OperatelyWeb.Api.Mutations.EditProjectTimeline
  mutation :join_space, OperatelyWeb.Api.Mutations.JoinSpace
  mutation :mark_all_notifications_as_read, OperatelyWeb.Api.Mutations.MarkAllNotificationsAsRead
  mutation :mark_notification_as_read, OperatelyWeb.Api.Mutations.MarkNotificationAsRead
  mutation :move_project_to_space, OperatelyWeb.Api.Mutations.MoveProjectToSpace
  mutation :new_invitation_token, OperatelyWeb.Api.Mutations.NewInvitationToken
  mutation :pause_project, OperatelyWeb.Api.Mutations.PauseProject
  mutation :post_discussion, OperatelyWeb.Api.Mutations.PostDiscussion
  mutation :post_milestone_comment, OperatelyWeb.Api.Mutations.PostMilestoneComment
  mutation :post_project_check_in, OperatelyWeb.Api.Mutations.PostProjectCheckIn
  mutation :remove_company_admin, OperatelyWeb.Api.Mutations.RemoveCompanyAdmin
  mutation :remove_company_member, OperatelyWeb.Api.Mutations.RemoveCompanyMember
  mutation :remove_company_trusted_email_domain, OperatelyWeb.Api.Mutations.RemoveCompanyTrustedEmailDomain
  mutation :remove_group_member, OperatelyWeb.Api.Mutations.RemoveGroupMember
  mutation :remove_key_resource, OperatelyWeb.Api.Mutations.RemoveKeyResource
  mutation :remove_project_contributor, OperatelyWeb.Api.Mutations.RemoveProjectContributor
  mutation :remove_project_milestone, OperatelyWeb.Api.Mutations.RemoveProjectMilestone
  mutation :reopen_goal, OperatelyWeb.Api.Mutations.ReopenGoal
  mutation :resume_project, OperatelyWeb.Api.Mutations.ResumeProject
  mutation :set_milestone_deadline, OperatelyWeb.Api.Mutations.SetMilestoneDeadline
  mutation :update_group_appearance, OperatelyWeb.Api.Mutations.UpdateGroupAppearance
  mutation :update_milestone, OperatelyWeb.Api.Mutations.UpdateMilestone
  mutation :update_milestone_description, OperatelyWeb.Api.Mutations.UpdateMilestoneDescription
  mutation :update_my_profile, OperatelyWeb.Api.Mutations.UpdateMyProfile
  mutation :update_project_contributor, OperatelyWeb.Api.Mutations.UpdateProjectContributor
  mutation :update_project_description, OperatelyWeb.Api.Mutations.UpdateProjectDescription
  mutation :update_task, OperatelyWeb.Api.Mutations.UpdateTask
  mutation :update_task_status, OperatelyWeb.Api.Mutations.UpdateTaskStatus
end
