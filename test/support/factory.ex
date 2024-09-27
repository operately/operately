defmodule Operately.Support.Factory do
  alias Operately.Support.Factory.{Projects, Spaces, Companies, Accounts, Messages}

  def setup(ctx) do
    ctx = add_account(ctx, :account)
    ctx = add_company(ctx, :company, ctx.account)

    Map.put(ctx, :creator, Ecto.assoc(ctx.company, :people) |> Operately.Repo.all() |> hd())
  end

  # accounts
  defdelegate add_account(ctx, testid), to: Accounts
  defdelegate log_in_person(ctx, person_name), to: Accounts
  defdelegate log_in_contributor(ctx, contributor_name), to: Accounts

  # companies
  defdelegate add_company(ctx, testid, account_name, opts \\ []), to: Companies
  defdelegate add_company_member(ctx, testid, opts \\ []), to: Companies

  # spaces
  defdelegate add_space(ctx, testid, opts \\ []), to: Spaces
  defdelegate add_space_member(ctx, testid, space_name, opts \\ []), to: Spaces

  # projects
  defdelegate add_project(ctx, testid, space_name), to: Projects
  defdelegate add_project_reviewer(ctx, testid, project_name, opts \\ []), to: Projects
  defdelegate add_project_contributor(ctx, testid, project_name, opts \\ []), to: Projects
  defdelegate add_project_retrospective(ctx, testid, project_name, author_name), to: Projects
  defdelegate add_project_check_in(ctx, testid, project_name, author_name), to: Projects
  defdelegate add_project_milestone(ctx, testid, project_name, author_name), to: Projects
  defdelegate edit_project_company_members_access(ctx, project_name, access_level), to: Projects
  defdelegate edit_project_space_members_access(ctx, project_name, access_level), to: Projects

  # messages
  defdelegate add_message(ctx, testid, space_name, opts \\ []), to: Messages

end
