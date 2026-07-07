defmodule OperatelyWeb.Mcp.ToolConnHelper do
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Plug.Conn
  alias Operately.Mcp.RateLimit
  alias Operately.People
  alias Operately.Repo
  alias Operately.RichContent
  alias OperatelyWeb.Api.Helpers, as: ApiHelpers

  @default_rate_limits %{
    oauth_authorize: %{limit: 10_000, period_seconds: 60, keys: [:ip]},
    oauth_token: %{limit: 10_000, period_seconds: 60, keys: [:ip, :client_id]},
    cimd_fetch_url: %{limit: 10_000, period_seconds: 60, keys: [:client_id]},
    tools_call: %{limit: 10_000, period_seconds: 60, keys: [:grant_id]}
  }

  def conn_with_assigns(account, company, person, scopes \\ ["mcp:read"]) do
    %Conn{}
    |> Map.put(:assigns, %{
      current_account: account,
      current_company: company,
      current_person: person,
      mcp_scopes: scopes,
      api_auth_mode: :mcp_oauth
    })
  end

  def fresh_context do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    person = People.get_person(account, company)

    %{account: account, company: company, person: person}
  end

  def conn(ctx, scopes \\ ["mcp:read", "mcp:write"]) do
    conn_as(ctx, default_person(ctx), scopes)
  end

  def conn_as(ctx, person_or_key, scopes \\ ["mcp:read", "mcp:write"])

  def conn_as(ctx, person_key, scopes) when is_atom(person_key) do
    conn_as(ctx, Map.fetch!(ctx, person_key), scopes)
  end

  def conn_as(ctx, person, scopes) do
    conn_with_assigns(ctx.account, ctx.company, person, scopes)
  end

  def reload(resource), do: Repo.reload(resource)

  def reload(resource, preloads) do
    resource
    |> Repo.reload()
    |> Repo.preload(preloads)
  end

  def decode_id!(id) do
    {:ok, decoded_id} = ApiHelpers.decode_id(id)
    decoded_id
  end

  def rich_text_to_string(nil), do: nil

  def rich_text_to_string(content) when is_binary(content) do
    content
    |> Jason.decode!()
    |> rich_text_to_string()
  end

  def rich_text_to_string(content) when is_map(content) do
    content
    |> RichContent.rich_content_to_string()
    |> normalize_text()
  end

  def normalize_text(text) do
    text
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end

  def with_rate_limits(overrides, fun) when is_map(overrides) and is_function(fun, 0) do
    previous_limits = Application.get_env(:operately, :mcp_rate_limits)
    limits = Map.merge(@default_rate_limits, previous_limits || %{}) |> Map.merge(overrides)

    Application.put_env(:operately, :mcp_rate_limits, limits)
    RateLimit.clear()

    try do
      fun.()
    after
      Application.put_env(:operately, :mcp_rate_limits, previous_limits)
      RateLimit.clear()
    end
  end

  defp default_person(ctx) do
    Map.get(ctx, :person) || Map.fetch!(ctx, :creator)
  end
end
