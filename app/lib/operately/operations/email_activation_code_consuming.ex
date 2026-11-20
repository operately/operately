defmodule Operately.Operations.EmailActivationCodeConsuming do
  import Ecto.Query, warn: false

  alias Operately.People.EmailActivationCode
  alias Operately.Repo

  # Legacy records were delivered before signup normalized surrounding whitespace.
  @email_whitespace " \t\n\r\f\v\u0085\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000"

  def run(email, code) when is_binary(email) do
    email = Operately.People.Account.normalize_email(email)

    with {:ok, normalized_code} <- normalize_code(code) do
      Repo.transaction(fn ->
        query =
          from(c in EmailActivationCode,
            where: fragment("lower(btrim(?, ?))", c.email, ^@email_whitespace) == ^email and c.code == ^normalized_code,
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

  defp normalize_code(code) when is_binary(code) do
    code = String.trim(code)

    if Regex.match?(~r/\A[A-Z0-9]{3}-?[A-Z0-9]{3}\z/, code) do
      {:ok, String.replace(code, "-", "")}
    else
      {:error, :invalid_code}
    end
  end

  defp normalize_code(_), do: {:error, :invalid_code}

  defp check_validity(activation) do
    if DateTime.compare(activation.expires_at, DateTime.utc_now()) == :gt do
      {:ok, :valid}
    else
      {:error, :invalid}
    end
  end
end
