defmodule OperatelyWeb.Api do
  defmacro common_endpoints do
    quote do
      alias OperatelyWeb.Api.Queries, as: Q
      alias OperatelyWeb.Api.Mutations, as: M
      alias OperatelyWeb.Api.Subscriptions, as: S

      @doc "Get, list, create and manage goals"
      namespace(:goals) do
        query(:get, OperatelyWeb.Api.Goals.Get)
        query(:list, OperatelyWeb.Api.Goals.List)
        query(:list_access_members, OperatelyWeb.Api.Goals.ListAccessMembers)
        query(:list_check_ins, Q.ListGoalCheckIns)
        query(:list_contributors, OperatelyWeb.Api.Goals.ListContributors)
        query(:search_parent_goal, OperatelyWeb.Api.Goals.SearchParentGoal)
        query(:get_check_in, OperatelyWeb.Api.Goals.GetCheckIn)
        query(:list_discussions, OperatelyWeb.Api.Goals.ListDiscussions)

        mutation(:create, OperatelyWeb.Api.Goals.Create)
        mutation(:change_parent, OperatelyWeb.Api.Goals.ChangeParent)
        mutation(:close, OperatelyWeb.Api.Goals.Close)
        mutation(:delete, OperatelyWeb.Api.Goals.Delete)
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
        mutation(:reopen, OperatelyWeb.Api.Goals.Reopen)
        mutation(:update_check, OperatelyWeb.Api.GoalChecks.Update)
        mutation(:update_check_index, OperatelyWeb.Api.GoalChecks.UpdateIndex)
        mutation(:toggle_check, OperatelyWeb.Api.GoalChecks.Toggle)

        mutation(:create_check_in, OperatelyWeb.Api.Goals.CreateCheckIn)
        mutation(:update_check_in, OperatelyWeb.Api.Goals.UpdateCheckIn)
        mutation(:acknowledge_check_in, OperatelyWeb.Api.Goals.AcknowledgeCheckIn)
        mutation(:acknowledge_retrospective, OperatelyWeb.Api.Goals.AcknowledgeRetrospective)
        mutation(:delete_check_in, OperatelyWeb.Api.Goals.DeleteCheckIn)
        mutation(:create_discussion, OperatelyWeb.Api.Goals.CreateDiscussion)
        mutation(:update_discussion, OperatelyWeb.Api.Goals.UpdateDiscussion)
      end

      @doc "Get, list, create and manage projects"
      namespace(:projects) do
        query(:get, OperatelyWeb.Api.Projects.Get)
        query(:list, OperatelyWeb.Api.Projects.List)
        query(:search_parent_goal, OperatelyWeb.Api.Projects.SearchParentGoal)
        query(:search_potential_contributors, OperatelyWeb.Api.Projects.SearchPotentialContributors)
        query(:search, OperatelyWeb.Api.Projects.Search)
        query(:list_milestones, OperatelyWeb.Api.Projects.ListMilestones)
        query(:list_contributors, OperatelyWeb.Api.Projects.ListContributors)
        query(:count_children, OperatelyWeb.Api.Projects.CountChildren)
        query(:get_contributor, OperatelyWeb.Api.Projects.GetContributor)
        query(:get_retrospective, OperatelyWeb.Api.Projects.GetRetrospective)

        mutation(:create, OperatelyWeb.Api.Projects.Create)
        mutation(:close, OperatelyWeb.Api.Projects.Close)
        mutation(:delete_contributor, OperatelyWeb.Api.Projects.DeleteContributor)
        mutation(:move_to_space, OperatelyWeb.Api.Projects.MoveToSpace)
        mutation(:pause, OperatelyWeb.Api.Projects.Pause)
        mutation(:resume, OperatelyWeb.Api.Projects.Resume)
        mutation(:update_due_date, OperatelyWeb.Api.Projects.UpdateDueDate)
        mutation(:update_name, OperatelyWeb.Api.Projects.UpdateName)
        mutation(:update_permissions, OperatelyWeb.Api.Projects.UpdatePermissions)
        mutation(:update_retrospective, OperatelyWeb.Api.Projects.UpdateRetrospective)
        mutation(:acknowledge_retrospective, OperatelyWeb.Api.Projects.AcknowledgeRetrospective)
        mutation(:update_start_date, OperatelyWeb.Api.Projects.UpdateStartDate)
        mutation(:update_champion, OperatelyWeb.Api.Projects.UpdateChampion)
        mutation(:update_reviewer, OperatelyWeb.Api.Projects.UpdateReviewer)
        mutation(:update_parent_goal, OperatelyWeb.Api.Projects.UpdateParentGoal)
        mutation(:create_milestone, OperatelyWeb.Api.Projects.CreateMilestone)
        mutation(:update_milestone, OperatelyWeb.Api.Projects.UpdateMilestone)
        mutation(:update_task_statuses, OperatelyWeb.Api.Projects.UpdateTaskStatuses)
        mutation(:delete, OperatelyWeb.Api.Projects.DeleteProject)
        mutation(:update_contributor, OperatelyWeb.Api.Projects.UpdateContributor)
        mutation(:update_description, OperatelyWeb.Api.Projects.UpdateDescription)
        mutation(:create_contributor, OperatelyWeb.Api.Projects.CreateContributor)
        mutation(:create_contributors, OperatelyWeb.Api.Projects.CreateContributors)

        query(:get_check_in, OperatelyWeb.Api.Projects.GetCheckIn)
        query(:list_check_ins, OperatelyWeb.Api.Projects.ListCheckIns)
        query(:get_discussion, OperatelyWeb.Api.Projects.Discussions.Get)
        query(:list_discussions, OperatelyWeb.Api.Projects.Discussions.List)

        mutation(:create_check_in, OperatelyWeb.Api.Projects.CreateCheckIn)
        mutation(:update_check_in, OperatelyWeb.Api.Projects.UpdateCheckIn)
        mutation(:acknowledge_check_in, OperatelyWeb.Api.Projects.AcknowledgeCheckIn)
        mutation(:delete_check_in, OperatelyWeb.Api.Projects.DeleteCheckIn)
        mutation(:create_discussion, OperatelyWeb.Api.Projects.Discussions.Create)
        mutation(:update_discussion, OperatelyWeb.Api.Projects.Discussions.Update)

        query(:get_milestone, OperatelyWeb.Api.Projects.GetMilestone)
        query(:list_milestone_tasks, OperatelyWeb.Api.Projects.Milestones.ListTasks)

        mutation(:create_milestone_comment, OperatelyWeb.Api.Projects.CreateMilestoneComment)
        mutation(:delete_milestone, OperatelyWeb.Api.Projects.Milestones.Delete)
        mutation(:update_milestone_title, OperatelyWeb.Api.Projects.Milestones.UpdateTitle)
        mutation(:update_milestone_kanban, OperatelyWeb.Api.Projects.Milestones.UpdateKanban)
        mutation(:update_milestone_due_date, OperatelyWeb.Api.Projects.Milestones.UpdateDueDate)
        mutation(:update_milestone_description, OperatelyWeb.Api.Projects.Milestones.UpdateDescription)
        mutation(:update_milestone_ordering, OperatelyWeb.Api.Projects.Milestones.UpdateOrdering)
      end

      @doc "Get, list, create and manage tasks across projects and spaces"
      namespace(:tasks) do
        query(:get, OperatelyWeb.Api.Tasks.Get)
        query(:list, OperatelyWeb.Api.Tasks.List)
        query(:list_potential_assignees, OperatelyWeb.Api.Tasks.ListPotentialAssignees)
        query(:list_task_statuses, OperatelyWeb.Api.Tasks.ListTaskStatuses)

        mutation(:create, OperatelyWeb.Api.Tasks.Create)
        mutation(:delete, OperatelyWeb.Api.Tasks.Delete)
        mutation(:move, OperatelyWeb.Api.Tasks.Move)
        mutation(:update_name, OperatelyWeb.Api.Tasks.UpdateName)
        mutation(:update_status, OperatelyWeb.Api.Tasks.UpdateStatus)
        mutation(:update_due_date, OperatelyWeb.Api.Tasks.UpdateDueDate)
        mutation(:update_reminders, OperatelyWeb.Api.Tasks.UpdateReminders)
        mutation(:update_assignee, OperatelyWeb.Api.Tasks.UpdateAssignee)
        mutation(:update_milestone, OperatelyWeb.Api.Tasks.UpdateMilestone)
        mutation(:update_milestone_and_ordering, OperatelyWeb.Api.Tasks.UpdateMilestoneAndOrdering)
        mutation(:update_description, OperatelyWeb.Api.Tasks.UpdateDescription)
      end

      @doc "Get, list, create and manage spaces"
      namespace(:spaces) do
        query(:get, OperatelyWeb.Api.Spaces.Get)
        query(:list, OperatelyWeb.Api.Spaces.List)
        query(:search, OperatelyWeb.Api.Spaces.Search)
        query(:search_potential_members, OperatelyWeb.Api.Spaces.SearchPotentialMembers)
        query(:count_by_access_level, OperatelyWeb.Api.Spaces.CountByAccessLevel)
        query(:list_members, OperatelyWeb.Api.Spaces.ListMembers)
        query(:list_tasks, OperatelyWeb.Api.Spaces.ListTasks)
        query(:list_tools, OperatelyWeb.Api.Spaces.ListTools)
        query(:get_discussion, OperatelyWeb.Api.Spaces.GetDiscussion)
        query(:list_discussions, OperatelyWeb.Api.Spaces.ListDiscussions)

        mutation(:add_members, OperatelyWeb.Api.Spaces.AddMembers)
        mutation(:create, OperatelyWeb.Api.Spaces.Create)
        mutation(:delete, OperatelyWeb.Api.Spaces.Delete)
        mutation(:delete_member, OperatelyWeb.Api.Spaces.DeleteMember)
        mutation(:join, OperatelyWeb.Api.Spaces.Join)
        mutation(:update_task_statuses, OperatelyWeb.Api.Spaces.UpdateTaskStatuses)
        mutation(:update, OperatelyWeb.Api.Spaces.Update)
        mutation(:update_members_permissions, OperatelyWeb.Api.Spaces.UpdateMembersPermissions)
        mutation(:update_permissions, OperatelyWeb.Api.Spaces.UpdatePermissions)
        mutation(:update_tools, OperatelyWeb.Api.Spaces.UpdateTools)
        mutation(:archive_discussion, OperatelyWeb.Api.Spaces.ArchiveDiscussion)
        mutation(:create_discussion, OperatelyWeb.Api.Spaces.CreateDiscussion)
        mutation(:publish_discussion, OperatelyWeb.Api.Spaces.PublishDiscussion)
        mutation(:update_discussion, OperatelyWeb.Api.Spaces.UpdateDiscussion)
      end

      @doc "Get, list, update and manage user profiles and account settings"
      namespace(:people) do
        query(:get_account, OperatelyWeb.Api.People.GetAccount)
        query(:get_me, OperatelyWeb.Api.People.GetMe)
        query(:list_assignments, OperatelyWeb.Api.People.ListAssignments)
        query(:get_assignments_count, OperatelyWeb.Api.People.GetAssignmentsCount)
        query(:list, OperatelyWeb.Api.People.List)
        query(:get, OperatelyWeb.Api.People.Get)
        query(:get_binded, OperatelyWeb.Api.People.GetBinded)
        query(:search, OperatelyWeb.Api.People.Search)
        query(:list_possible_managers, OperatelyWeb.Api.People.ListPossibleManagers)

        mutation(:update, OperatelyWeb.Api.People.Update)
        mutation(:update_theme, OperatelyWeb.Api.People.UpdateTheme)
        mutation(:update_picture, OperatelyWeb.Api.People.UpdatePicture, catalog: false)
      end

      @doc "Get, list, update and manage company settings, members, and permissions"
      namespace(:companies) do
        query(:list, OperatelyWeb.Api.Companies.List)
        query(:get, OperatelyWeb.Api.Companies.Get)
        query(:list_activities, OperatelyWeb.Api.Companies.ListActivities)
        query(:get_activity, OperatelyWeb.Api.Companies.GetActivity)
        query(:get_work_map, OperatelyWeb.Api.Companies.GetWorkMap)
        query(:get_flat_work_map, OperatelyWeb.Api.Companies.GetFlatWorkMap)
        query(:global_search, OperatelyWeb.Api.Companies.GlobalSearch)

        mutation(:restore_member, OperatelyWeb.Api.Companies.RestoreMember)
        mutation(:convert_member_to_guest, OperatelyWeb.Api.Companies.ConvertMemberToGuest)
        mutation(:create_admins, OperatelyWeb.Api.Companies.CreateAdmins)
        mutation(:create_member, OperatelyWeb.Api.Companies.CreateMember)
        mutation(:update_members_permissions, OperatelyWeb.Api.Companies.UpdateMembersPermissions)
        mutation(:delete_activity, OperatelyWeb.Api.Companies.DeleteActivity)
        mutation(:delete_admin, OperatelyWeb.Api.Companies.DeleteAdmin)
        mutation(:delete_member, OperatelyWeb.Api.Companies.DeleteMember)
        mutation(:delete_trusted_email_domain, OperatelyWeb.Api.Companies.DeleteTrustedEmailDomain)
        mutation(:delete_owner, OperatelyWeb.Api.Companies.DeleteOwner)
        mutation(:update, OperatelyWeb.Api.Companies.Update)
        mutation(:invite_guest, OperatelyWeb.Api.Companies.InviteGuest)
        mutation(:grant_resource_access, OperatelyWeb.Api.Companies.GrantResourceAccess)
      end

      @doc "List, create and manage comments on resources"
      namespace(:comments) do
        query(:list, OperatelyWeb.Api.Comments.List)
        mutation(:create, OperatelyWeb.Api.Comments.Create)
        mutation(:delete, OperatelyWeb.Api.Comments.Delete)
        mutation(:update, OperatelyWeb.Api.Comments.Update)
      end

      @doc "Add or remove emoji reactions to content"
      namespace(:reactions) do
        mutation(:create, OperatelyWeb.Api.Reactions.Create)
        mutation(:delete, OperatelyWeb.Api.Reactions.Delete)
      end

      # Legacy Docs & Files routes stay on the external API for CLI <= 1.6.0 backward
      # compatibility but are hidden from the catalog. The documents namespace
      # is the supported CLI-facing surface for new clients.
      namespace(:resource_hubs, catalog: false) do
        query(:get, OperatelyWeb.Api.ResourceHubs.Get)
        query(:list_nodes, OperatelyWeb.Api.ResourceHubs.ListNodes)
        query(:get_folder, OperatelyWeb.Api.ResourceHubs.GetFolder)
        query(:search, OperatelyWeb.Api.ResourceHubs.Search)

        mutation(:update_parent_folder, OperatelyWeb.Api.ResourceHubs.UpdateParentFolder)
        mutation(:copy_folder, OperatelyWeb.Api.ResourceHubs.CopyFolder)
        mutation(:create_folder, OperatelyWeb.Api.ResourceHubs.CreateFolder)
        mutation(:delete_folder, OperatelyWeb.Api.ResourceHubs.DeleteFolder)
        mutation(:rename_folder, OperatelyWeb.Api.ResourceHubs.RenameFolder)
      end

      namespace(:documents, catalog: false) do
        query(:get, OperatelyWeb.Api.Documents.Get)
        query(:list_versions, OperatelyWeb.Api.Documents.ListVersions)
        query(:get_version, OperatelyWeb.Api.Documents.GetVersion)

        mutation(:create, OperatelyWeb.Api.Documents.Create)
        mutation(:publish, OperatelyWeb.Api.Documents.Publish)
        mutation(:delete, OperatelyWeb.Api.Documents.Delete)
        mutation(:update, OperatelyWeb.Api.Documents.Update)
        mutation(:restore_version, OperatelyWeb.Api.Documents.RestoreVersion)
      end

      namespace(:links, catalog: false) do
        query(:get, OperatelyWeb.Api.Links.Get)

        mutation(:create, OperatelyWeb.Api.Links.Create)
        mutation(:delete, OperatelyWeb.Api.Links.Delete)
        mutation(:update, OperatelyWeb.Api.Links.Update)
      end

      namespace(:files, catalog: false) do
        query(:get, OperatelyWeb.Api.Files.Get)

        mutation(:create, OperatelyWeb.Api.Files.Create)
        mutation(:delete, OperatelyWeb.Api.Files.Delete)
        mutation(:update, OperatelyWeb.Api.Files.Update)
      end

      @doc "List and manage notifications and subscriptions"
      namespace(:notifications) do
        query(:list, OperatelyWeb.Api.Notifications.List)
        query(:get_unread_count, OperatelyWeb.Api.Notifications.GetUnreadCount)
        query(:is_subscribed, OperatelyWeb.Api.Notifications.IsSubscribed)

        mutation(:update_subscriptions_list, OperatelyWeb.Api.Notifications.UpdateSubscriptionsList)
        mutation(:mark_all_as_read, OperatelyWeb.Api.Notifications.MarkAllAsRead)
        mutation(:mark_as_read, OperatelyWeb.Api.Notifications.MarkAsRead)
        mutation(:mark_many_as_read, OperatelyWeb.Api.Notifications.MarkManyAsRead)
        mutation(:subscribe, OperatelyWeb.Api.Notifications.Subscribe)
        mutation(:unsubscribe, OperatelyWeb.Api.Notifications.Unsubscribe)
      end

      mutation(:create_avatar_blob, OperatelyWeb.Api.Mutations.CreateAvatarBlob, catalog: false)
      mutation(:create_blob, OperatelyWeb.Api.Mutations.CreateBlob, catalog: false)
      mutation(:mark_blob_uploaded, OperatelyWeb.Api.Mutations.MarkBlobUploaded, catalog: false)

      subscription(:assignments_count, S.AssignmentsCount)
      subscription(:reload_comments, S.ReloadComments)
      subscription(:unread_notifications_count, S.UnreadNotificationsCount)
      subscription(:profile_updated, S.ProfileUpdated)
      subscription(:billing_updated, S.BillingUpdated)
    end
  end

  defmacro internal_endpoints do
    quote do
      common_endpoints()

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

      namespace(:companies) do
        mutation(:create, OperatelyWeb.Api.Companies.Create)
      end

      namespace(:billing) do
        query(:get, OperatelyWeb.Api.Billing.Get)
        query(:get_catalog, OperatelyWeb.Api.Billing.GetCatalog)
        query(:get_access_state, OperatelyWeb.Api.Billing.GetAccessState)
        query(:get_limit_warnings, OperatelyWeb.Api.Billing.GetLimitWarnings)

        mutation(:change_plan, OperatelyWeb.Api.Billing.ChangePlan)
        mutation(:cancel, OperatelyWeb.Api.Billing.Cancel)
        mutation(:reactivate, OperatelyWeb.Api.Billing.Reactivate)
        mutation(:create_checkout_session, OperatelyWeb.Api.Billing.CreateCheckoutSession)
        mutation(:create_payment_method_session, OperatelyWeb.Api.Billing.CreatePaymentMethodSession)
        mutation(:create_customer_portal_session, OperatelyWeb.Api.Billing.CreateCustomerPortalSession)
        mutation(:refresh, OperatelyWeb.Api.Billing.Refresh)
      end

      namespace(:site_messages) do
        query(:list_active, OperatelyWeb.Api.SiteMessages.ListActive)
      end

      namespace(:spaces) do
        mutation(:update_kanban, OperatelyWeb.Api.Spaces.UpdateKanban)
      end

      namespace(:projects) do
        mutation(:update_kanban, OperatelyWeb.Api.Projects.UpdateKanban)
      end

      namespace(:invitations) do
        # invitation endpoints are internal-only
        query(:get_invite_link_by_token, OperatelyWeb.Api.Invitations.GetInviteLinkByToken)
        query(:get_invite_link_availability, OperatelyWeb.Api.Invitations.GetInviteLinkAvailability)
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

      namespace(:mcp_grants) do
        query(:list, OperatelyWeb.Api.McpGrants.List)
        mutation(:revoke, OperatelyWeb.Api.McpGrants.Revoke)
      end

      namespace(:cli_auth) do
        query(:status, OperatelyWeb.Api.CliAuth.Status)
        query(:company_creation_status, OperatelyWeb.Api.CliAuth.CompanyCreationStatus)

        mutation(:auth_password, OperatelyWeb.Api.CliAuth.AuthPassword)
        mutation(:request_email_code, OperatelyWeb.Api.CliAuth.RequestEmailCode)
        mutation(:auth_email_code, OperatelyWeb.Api.CliAuth.AuthEmailCode)
        mutation(:start_google, OperatelyWeb.Api.CliAuth.StartGoogle)
        mutation(:start_google_signup, OperatelyWeb.Api.CliAuth.StartGoogleSignup)
        mutation(:create_token, OperatelyWeb.Api.CliAuth.CreateToken)
        mutation(:check_account, OperatelyWeb.Api.CliAuth.CheckAccount)
        mutation(:signup, OperatelyWeb.Api.CliAuth.Signup)
        mutation(:setup_company, OperatelyWeb.Api.CliAuth.SetupCompany)
        mutation(:create_company, OperatelyWeb.Api.CliAuth.CreateCompany)
        mutation(:join_company, OperatelyWeb.Api.CliAuth.JoinCompany)
        mutation(:join_with_invite, OperatelyWeb.Api.CliAuth.JoinWithInvite)
      end

      namespace(:company_transfers) do
        query(:get_export_run, OperatelyWeb.Api.CompanyTransfers.GetExportRun)
        query(:list_export_runs, OperatelyWeb.Api.CompanyTransfers.ListExportRuns)
        query(:get_import_run, OperatelyWeb.Api.CompanyTransfers.GetImportRun)
        query(:list_import_runs, OperatelyWeb.Api.CompanyTransfers.ListImportRuns)

        mutation(:create_import_artifact_blobs, OperatelyWeb.Api.CompanyTransfers.CreateImportArtifactBlobs)
        mutation(:start_export, OperatelyWeb.Api.CompanyTransfers.StartExport)
        mutation(:start_import, OperatelyWeb.Api.CompanyTransfers.StartImport)
      end
    end
  end

  defmacro external_endpoints do
    quote do
      common_endpoints()

      @doc "Browse and manage Docs & Files"
      namespace(:documents) do
        query(:list_contents, OperatelyWeb.Api.Wrappers.DocsAndFiles.ListContents)
        query(:search, OperatelyWeb.Api.ResourceHubs.Search)
        query(:get_folder, OperatelyWeb.Api.ResourceHubs.GetFolder)
        query(:get_document, OperatelyWeb.Api.Documents.Get)
        query(:get_link, OperatelyWeb.Api.Links.Get)
        query(:get_file, OperatelyWeb.Api.Files.Get)

        mutation(:create_folder, OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFolder)
        mutation(:copy_folder, OperatelyWeb.Api.ResourceHubs.CopyFolder)
        mutation(:delete_folder, OperatelyWeb.Api.ResourceHubs.DeleteFolder)
        mutation(:rename_folder, OperatelyWeb.Api.ResourceHubs.RenameFolder)
        mutation(:update_parent_folder, OperatelyWeb.Api.ResourceHubs.UpdateParentFolder)

        mutation(:create_document, OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateDocument)
        mutation(:publish_document, OperatelyWeb.Api.Documents.Publish)
        mutation(:delete_document, OperatelyWeb.Api.Documents.Delete)
        mutation(:update_document, OperatelyWeb.Api.Documents.Update)

        mutation(:create_link, OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateLink)
        mutation(:delete_link, OperatelyWeb.Api.Links.Delete)
        mutation(:update_link, OperatelyWeb.Api.Links.Update)

        mutation(:create_file, OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFile, catalog: false)
        mutation(:delete_file, OperatelyWeb.Api.Files.Delete)
        mutation(:update_file, OperatelyWeb.Api.Files.Update)
      end
    end
  end
end
