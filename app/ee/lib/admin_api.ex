defmodule OperatelyEE.AdminApi do
  use TurboConnect.Api

  use_types OperatelyEE.AdminApi.Types

  plug OperatelyEE.AdminApi.Plugs.RequireSiteAdmin

  alias OperatelyEE.AdminApi.Queries, as: Q
  alias OperatelyEE.AdminApi.Mutations, as: M

  query :get_companies, Q.GetCompanies
  query :get_active_companies, Q.GetActiveCompanies
  query :get_company, Q.GetCompany
  query :get_activities, Q.GetActivities

  mutation :enable_feature, M.EnableFeature
end
