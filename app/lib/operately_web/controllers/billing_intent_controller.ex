defmodule OperatelyWeb.BillingIntentController do
  use OperatelyWeb, :controller

  alias Operately.Companies

  def index(conn, params) do
    plan = params["plan"]
    billing_period = params["billing_period"]

    query = build_query_params(plan, billing_period)

    case conn.assigns[:current_account] do
      nil ->
        redirect_to_login(conn, query)

      account ->
        handle_authenticated(conn, account, plan, billing_period)
    end
  end

  defp redirect_to_login(conn, query) do
    redirect_to = "/billing/intent" <> query
    encoded = URI.encode_www_form(redirect_to)
    redirect(conn, to: "/log_in?redirect_to=#{encoded}")
  end

  defp handle_authenticated(conn, account, plan, billing_period) do
    companies = Companies.list_companies(account)
    billing_manager_companies = Companies.list_companies_by_billing_manager(account)

    cond do
      companies == [] ->
        redirect(conn, to: "/new" <> build_query_params(plan, billing_period))

      billing_manager_companies == [] ->
        redirect(conn, to: "/")

      length(billing_manager_companies) == 1 ->
        redirect(conn, to: billing_path(hd(billing_manager_companies), plan, billing_period))

      true ->
        redirect(conn, to: "/billing/pick-company" <> build_query_params(plan, billing_period))
    end
  end

  defp build_query_params(nil, nil), do: ""

  defp build_query_params(plan, billing_period) do
    params = []
    params = if plan, do: params ++ [{"plan", plan}], else: params
    params = if billing_period, do: params ++ [{"billing_period", billing_period}], else: params

    case params do
      [] -> ""
      _ -> "?" <> URI.encode_query(params)
    end
  end

  defp billing_path(company, plan, billing_period) do
    company_id = OperatelyWeb.Paths.company_id(company)
    "/#{company_id}/admin/billing/plans" <> build_query_params(plan, billing_period)
  end
end
