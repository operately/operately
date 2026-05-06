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
    case Account.get(:system, email: email) do
      {:ok, account} ->
        case update_avatar(account, image) do
          {:ok, account} -> {:ok, account, :existing}
          {:error, reason} -> {:error, reason}
        end

      {:error, _reason} -> {:error, :not_found}
    end
  end

  defp create_new_account(attrs) do
    case Account.create(attrs[:name], attrs[:email], random_password()) do
      {:ok, account} -> {:ok, account, :created}
      {:error, reason} -> {:error, reason}
    end
  end

  #
  # Utility functions
  #

  defp first_succesfull([strategy | rest], params, on_not_found: on_not_found) do
    case strategy.(params) do
      {:ok, result, source} -> {:ok, result, source}
      {:error, :not_found} -> first_succesfull(rest, params, on_not_found: on_not_found)
      {:error, reason} -> {:error, reason}
    end
  end

  defp first_succesfull([], _params, on_not_found: on_not_found) do
    on_not_found
  end

  @rand_pass_length 32

  defp random_password do
    :crypto.strong_rand_bytes(@rand_pass_length) |> Base.encode64()
  end

  defp update_avatar(account, image) do
    people = Operately.Repo.preload(account, :people).people

    Enum.reduce_while(people, {:ok, account}, fn person, {:ok, account} ->
      cond do
        person.avatar_blob_id -> {:cont, {:ok, account}}
        person.avatar_url == image -> {:cont, {:ok, account}}
        true ->
          case Operately.People.update_person(person, %{avatar_url: image}) do
            {:ok, _person} -> {:cont, {:ok, account}}
            {:error, reason} -> {:halt, {:error, reason}}
          end
      end
    end)
  end

end
