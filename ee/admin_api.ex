defmodule Operately.EE.AdminAPI do
  use TurboConnect.Api

  use_types Operately.EE.AdminAPI.Types

  plug Operately.EE.AdminAPI.Plugs.RequireSiteAdmin

  alias Operately.EE.AdminAPI.Queries, as: Q

  query :get_companies, Q.GetCompanies
end
