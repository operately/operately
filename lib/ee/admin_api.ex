defmodule OperatelyEE.AdminApi do
  use TurboConnect.Api

  use_types OperatelyEE.AdminApi.Types

  plug OperatelyEE.AdminApi.Plugs.RequireSiteAdmin

  alias OperatelyEE.AdminApi.Queries, as: Q

  query :get_companies, Q.GetCompanies
  query :get_company, Q.GetCompany
end
