defmodule OperatelyWeb.Paths do
  alias Operately.Companies.Company
  alias Operately.Goals.Goal
  alias Operately.Groups.Group

  def home_path(company = %Company{}) do
    create_path([company_id(company)])
  end

  def goal_path(company = %Company{}, goal = %Goal{}) do
    create_path([company_id(company), "goals", goal_id(goal)])
  end

  def goals_path(company = %Company{}) do
    create_path([company_id(company), "goals"])
  end

  def space_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space)])
  end

  def space_goals_path(company = %Company{}, space = %Group{}) do
    create_path([company_id(company), "spaces", space_id(space), "goals"])
  end

  def feed_path(company = %Company{}) do
    create_path([company_id(company), "feed"])
  end

  def notifications_path(company = %Company{}) do
    create_path([company_id(company), "notifications"])
  end

  @doc """
  Returns the URL for the given path.

  Example:
    path = Paths.goal_path(company, goal)
    url = Paths.to_url(path)
  """
  def to_url(path) do
    OperatelyWeb.Endpoint.url() <> path
  end

  #
  # ID Helpers
  #

  def company_id(company) do
    short_id = Operately.Companies.ShortId.encode(company.short_id)
    OperatelyWeb.Api.Helpers.id_with_comments(company.name, short_id)
  end

  def space_id(space) do
    space.id
  end

  def goal_id(goal) do
    goal.id
  end

  #
  # Path Construction Helpers
  #

  def create_path(parts) do
    "/" <> Enum.join(parts, "/")
  end

end
