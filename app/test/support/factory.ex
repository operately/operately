defmodule Operately.Support.Factory do
  alias Operately.Support.Factory

  def setup(ctx) do
    ctx = add_account(ctx, :account)
    ctx = add_company(ctx, :company, ctx.account)

    Map.put(ctx, :creator, Ecto.assoc(ctx.company, :people) |> Operately.Repo.all() |> hd())
  end

  # db record utilities
  defdelegate reload_all(ctx), to: Factory.Utils
  defdelegate reload(ctx, resource_name), to: Factory.Utils
  defdelegate preload(ctx, resource_name, preload), to: Factory.Utils

  # accounts
  defdelegate add_account(ctx, testid), to: Factory.Accounts
  defdelegate log_in_account(ctx, account_name), to: Factory.Accounts
  defdelegate log_in_person(ctx, person_name), to: Factory.Accounts
  defdelegate log_in_contributor(ctx, contributor_name), to: Factory.Accounts

  # companies
  defdelegate add_company(ctx, testid, account_name, opts \\ []), to: Factory.Companies
  defdelegate add_company_member(ctx, testid, opts \\ []), to: Factory.Companies
  defdelegate add_company_admin(ctx, testid, opts \\ []), to: Factory.Companies
  defdelegate add_company_owner(ctx, testid, opts \\ []), to: Factory.Companies
  defdelegate add_company_agent(ctx, testid, opts \\ []), to: Factory.Companies
  defdelegate set_person_manager(ctx, testid, manager_key), to: Factory.Companies
  defdelegate suspend_company_member(ctx, testid, opts \\ []), to: Factory.Companies
  defdelegate enable_feature(ctx, feature_name), to: Factory.Companies
  defdelegate disable_feature(ctx, feature_name), to: Factory.Companies

  # spaces
  defdelegate add_space(ctx, testid, opts \\ []), to: Factory.Spaces
  defdelegate add_space_member(ctx, testid, space_name, opts \\ []), to: Factory.Spaces

  # goals
  defdelegate add_goal(ctx, testid, space_name, opts \\ []), to: Factory.Goals
  defdelegate add_goal_update(ctx, testid, goal_name, person_name, opts \\ []), to: Factory.Goals
  defdelegate set_goal_next_update_date(ctx, goal_name, date), to: Factory.Goals
  defdelegate add_goal_target(ctx, testid, goal_name, attrs \\ []), to: Factory.Goals
  defdelegate close_goal(ctx, testid, opts \\ []), to: Factory.Goals
  defdelegate reopen_goal(ctx, testid, opts \\ []), to: Factory.Goals
  defdelegate add_goal_discussion(ctx, testid, goal_name, opts \\ []), to: Factory.Goals
  defdelegate add_goal_check(ctx, testid, goal_name, opts \\ []), to: Factory.Goals
  defdelegate acknowledge_goal_update(ctx, update_name, person_name), to: Factory.Goals
  defdelegate set_goal_reviewer(ctx, goal_name, reviewer_name), to: Factory.Goals

  # projects
  defdelegate add_project(ctx, testid, space_name, opts \\ []), to: Factory.Projects
  defdelegate add_project_reviewer(ctx, testid, project_name, opts \\ []), to: Factory.Projects
  defdelegate add_project_contributor(ctx, testid, project_name, opts \\ []), to: Factory.Projects
  defdelegate add_project_retrospective(ctx, testid, project_name, author_name), to: Factory.Projects
  defdelegate add_project_check_in(ctx, testid, project_name, author_name, opts \\ []), to: Factory.Projects
  defdelegate add_project_milestone(ctx, testid, project_name, opts \\ []), to: Factory.Projects
  defdelegate edit_project_company_members_access(ctx, project_name, access_level), to: Factory.Projects
  defdelegate edit_project_space_members_access(ctx, project_name, access_level), to: Factory.Projects
  defdelegate set_project_next_check_in_date(ctx, project_name, date), to: Factory.Projects
  defdelegate set_project_milestone_deadline(ctx, milestone_name, date), to: Factory.Projects
  defdelegate close_project(ctx, project_name), to: Factory.Projects
  defdelegate pause_project(ctx, project_name), to: Factory.Projects
  defdelegate close_project_milestone(ctx, milestone_name, creator_name \\ :creator), to: Factory.Projects
  defdelegate add_project_discussion(ctx, testid, project_name, opts \\ []), to: Factory.Projects
  defdelegate add_project_task(ctx, testid, milestone_name, opts \\ []), to: Factory.Projects
  defdelegate add_task_assignee(ctx, testid, task_name, person_name), to: Factory.Projects

  # messages
  defdelegate add_messages_board(ctx, testid, space_name, opts \\ []), to: Factory.Messages
  defdelegate add_message(ctx, testid, board_name, opts \\ []), to: Factory.Messages
  defdelegate add_draft_message(ctx, testid, board_name, opts \\ []), to: Factory.Messages

  # comments
  defdelegate add_comment(ctx, testid, parent_name, opts \\ []), to: Factory.Comments
  defdelegate add_reactions(ctx, testid, parent_name, opts \\ []), to: Factory.Comments

  # resource hubs
  defdelegate add_resource_hub(ctx, testid, space_name, creator_name, opts \\ []), to: Factory.ResourceHubs
  defdelegate add_folder(ctx, testid, hub_name, folder_name \\ nil), to: Factory.ResourceHubs
  defdelegate add_document(ctx, testid, hub_name, opts \\ []), to: Factory.ResourceHubs
  defdelegate add_file(ctx, testid, hub_name, opts \\ []), to: Factory.ResourceHubs
  defdelegate add_link(ctx, testid, hub_name, opts \\ []), to: Factory.ResourceHubs

  # blobs
  defdelegate add_blob(ctx, testid, author_name \\ :creator), to: Factory.Blobs

  # agent convos
  defdelegate add_agent_convo(ctx, testid, author, resource_name), to: Factory.AgentConvos
end
