defmodule Operately.Support.Factory do
  alias Operately.Support.Factory.{Projects, Spaces, Companies, Accounts, Messages, Goals, Comments, ResourceHubs, Blobs}

  def setup(ctx) do
    ctx = add_account(ctx, :account)
    ctx = add_company(ctx, :company, ctx.account)

    Map.put(ctx, :creator, Ecto.assoc(ctx.company, :people) |> Operately.Repo.all() |> hd())
  end

  def preload(ctx, resource_name, preload) do
    resource = Map.fetch!(ctx, resource_name)

    resource = Operately.Repo.preload(resource, preload)

    Map.put(ctx, resource_name, resource)
  end

  # accounts
  defdelegate add_account(ctx, testid), to: Accounts
  defdelegate log_in_person(ctx, person_name), to: Accounts
  defdelegate log_in_contributor(ctx, contributor_name), to: Accounts

  # companies
  defdelegate add_company(ctx, testid, account_name, opts \\ []), to: Companies
  defdelegate add_company_member(ctx, testid, opts \\ []), to: Companies
  defdelegate add_company_admin(ctx, testid, opts \\ []), to: Companies
  defdelegate add_company_owner(ctx, testid, opts \\ []), to: Companies
  defdelegate set_person_manager(ctx, testid, manager_key), to: Companies
  defdelegate suspend_company_member(ctx, testid, opts \\ []), to: Companies
  defdelegate enable_feature(ctx, feature_name), to: Companies

  # spaces
  defdelegate add_space(ctx, testid, opts \\ []), to: Spaces
  defdelegate add_space_member(ctx, testid, space_name, opts \\ []), to: Spaces

  # goals
  defdelegate add_goal(ctx, testid, space_name, opts \\ []), to: Goals
  defdelegate add_goal_update(ctx, testid, goal_name, person_name) , to: Goals
  defdelegate set_goal_next_update_date(ctx, goal_name, date), to: Goals

  # projects
  defdelegate add_project(ctx, testid, space_name, opts \\ []), to: Projects
  defdelegate add_project_reviewer(ctx, testid, project_name, opts \\ []), to: Projects
  defdelegate add_project_contributor(ctx, testid, project_name, opts \\ []), to: Projects
  defdelegate add_project_retrospective(ctx, testid, project_name, author_name), to: Projects
  defdelegate add_project_check_in(ctx, testid, project_name, author_name), to: Projects
  defdelegate add_project_milestone(ctx, testid, project_name, opts \\ []), to: Projects
  defdelegate edit_project_company_members_access(ctx, project_name, access_level), to: Projects
  defdelegate edit_project_space_members_access(ctx, project_name, access_level), to: Projects
  defdelegate set_project_next_check_in_date(ctx, project_name, date), to: Projects
  defdelegate set_project_milestone_deadline(ctx, milestone_name, date), to: Projects
  defdelegate close_project(ctx, project_name), to: Projects

  # messages
  defdelegate add_messages_board(ctx, testid, space_name, opts \\ []), to: Messages
  defdelegate add_message(ctx, testid, board_name, opts \\ []), to: Messages
  defdelegate add_draft_message(ctx, testid, board_name, opts \\ []), to: Messages

  # comments
  defdelegate add_comment(ctx, testid, parent_name, opts \\ []), to: Comments

  # resource hubs
  defdelegate add_resource_hub(ctx, testid, space_name, creator_name, opts \\ []), to: ResourceHubs
  defdelegate add_folder(ctx, testid, hub_name, folder_name \\ nil), to: ResourceHubs
  defdelegate add_document(ctx, testid, hub_name, opts \\ []), to: ResourceHubs
  defdelegate add_file(ctx, testid, hub_name, opts \\ []), to: ResourceHubs
  defdelegate add_link(ctx, testid, hub_name, opts \\ []), to: ResourceHubs

  # blobs
  defdelegate add_blob(ctx, testid, author_name \\ :creator), to: Blobs
end
