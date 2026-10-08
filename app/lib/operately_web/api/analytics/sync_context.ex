defmodule OperatelyWeb.Api.Analytics.SyncContext do
  use TurboConnect.Mutation
  import Plug.Conn

  inputs do
    field? :context, :json, null: true
  end

  outputs do
    field :opted_out, :boolean, null: false
    field? :company_id, :string, null: true
    field :acquisition, :json, null: false
  end

  @doc """
  Persists browser opt-outs on the account without clearing existing opt-outs.
  Returns acquisition attribution, company ID, and effective opt-out status so the
  frontend can decide whether to send a pageview and which context to attach.
  """
  def call(conn, inputs) do
    if browser_request?(conn) do
      context = Operately.Analytics.Context.normalize(inputs[:context])
      context = if OperatelyWeb.Analytics.context(conn).preference == "denied", do: Map.put(context, :preference, "denied"), else: context

      account = conn.assigns[:current_account]
      Operately.Analytics.sync_account(account, context)

      company = account && conn.assigns[:current_person] && conn.assigns[:current_company]
      company_id = company && company.id
      account_state = account && Operately.Repo.get(Operately.Analytics.AccountState, account.id)
      company_state = company_id && Operately.Repo.get(Operately.Analytics.CompanyState, company_id)

      acquisition =
        cond do
          company_state -> company_state.attribution
          account_state -> account_state.attribution
          true -> %{}
        end

      {:ok,
       %{
         acquisition: Jason.encode!(acquisition),
         company_id: company_id,
         opted_out: context.preference == "denied" or (account != nil and Operately.Analytics.opted_out?(account.id))
       }}
    else
      {:error, :forbidden}
    end
  end

  defp browser_request?(conn) do
    origin = OperatelyWeb.Endpoint.url() |> URI.parse()
    expected_origin = "#{origin.scheme}://#{origin.authority}"
    token = get_req_header(conn, "x-csrf-token") |> List.first()
    session_token = get_session(conn, "_csrf_token")

    conn.assigns[:api_auth_mode] not in [:api_token, :mcp_oauth] and
      get_req_header(conn, "origin") == [expected_origin] and
      is_binary(token) and is_binary(session_token) and
      Plug.CSRFProtection.valid_state_and_csrf_token?(session_token, token)
  end
end
