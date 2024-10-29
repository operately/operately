defmodule Operately.Operations.CompanyEditing do
  alias Operately.Goals.Notifications

  def dispatch(activity) do
    Operately.Notifications.bulk_create(...)
  end
end
