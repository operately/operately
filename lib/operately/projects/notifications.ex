defmodule Operately.Projects.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Projects.CheckIn

  def get_check_in_subscribers(check_in_id) do
    %{subscription_list: list, project: p} = from(c in CheckIn,
        where: c.id == ^check_in_id,
        preload: [project: :contributors, subscription_list: :subscriptions]
      )
      |> Repo.one()

    if list.send_to_everyone do
      Enum.filter(p.contributors, fn c ->
        case Enum.find(list.subscriptions, &(&1.person_id == c.person_id)) do
          nil -> true
          %{canceled: false} -> true
          _ -> false
        end
      end)
      |> Enum.map(&(&1.person_id))
    else
      Enum.map(list.subscriptions, &(&1.person_id))
    end
  end
end
