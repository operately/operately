defmodule Operately.Operations.EmailActivationCodeConsuming do
  import Ecto.Query, warn: false

  alias Operately.People.EmailActivationCode
  alias Operately.Repo

  def run(email, code) when is_binary(email) do
    with {:ok, normalized_code} <- normalize_code(code) do
      Repo.transaction(fn ->
        query =
          from(c in EmailActivationCode,
            where: c.email == ^email and c.code == ^normalized_code,
            lock: "FOR UPDATE"
          )

        case Repo.one(query) do
          nil ->
            Repo.rollback(:not_found)

          activation ->
            case check_validity(activation) do
              {:ok, :valid} ->
                case Repo.delete(activation) do
                  {:ok, _activation} -> activation
                  {:error, _changeset} -> Repo.rollback(:failed)
                end

              {:error, reason} ->
                Repo.rollback(reason)
            end
        end
      end)
      |> case do
        {:ok, activation} -> {:ok, activation}
        {:error, reason} -> {:error, reason}
      end
    end
  end

  defp normalize_code(nil), do: {:error, :invalid_code}

  defp normalize_code(code) do
    code = String.trim(code)

    cond do
      String.length(code) == 6 ->
        {:ok, code}

      String.length(code) == 7 ->
        {:ok, String.slice(code, 0, 3) <> String.slice(code, 4, 6)}

      true ->
        {:error, :invalid_code}
    end
  end

  defp check_validity(activation) do
    if DateTime.compare(activation.expires_at, DateTime.utc_now()) == :gt do
      {:ok, :valid}
    else
      {:error, :invalid}
    end
  end
end
