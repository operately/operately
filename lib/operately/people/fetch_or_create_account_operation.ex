defmodule Operately.People.FetchOrCreateAccountOperation do
  alias Operately.People.Account

  def call(attrs = %{email: _email, name: _name, image: _image}) do
    strategies = [
      &find_existing_account/1,
      &create_new_account/1
    ]

    first_succesfull(strategies, attrs, on_not_found: {:error, "Not found"})
  end

  #
  # Strategies
  #

  defp find_existing_account(%{email: email, image: image}) do
    account = Account.get(:system, email: email)

    if account == nil do
      {:error, "Not found"}
    else
      people = Operately.Repo.preload(account, :people).people

      Enum.each(people, fn person ->
        if person.avatar_url != image do
          {:ok, _} = Operately.People.update_person(person, %{avatar_url: image})
        end
      end)

      {:ok, account}
    end
  end

  defp create_new_account(attrs) do
    Account.create(attrs[:name], attrs[:email], random_password())
  end

  #
  # Utility functions
  #

  defp first_succesfull([strategy | rest], params, on_not_found: on_not_found) do
    case strategy.(params) do
      {:ok, result} ->    {:ok, result}
      {:error, _reason} -> first_succesfull(rest, params, on_not_found: on_not_found)
    end
  end

  defp first_succesfull([], _params, on_not_found: on_not_found) do
    on_not_found
  end

  @rand_pass_length 32

  defp random_password do
    :crypto.strong_rand_bytes(@rand_pass_length) |> Base.encode64()
  end

end
