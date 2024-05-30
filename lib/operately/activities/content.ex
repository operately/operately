defmodule Operately.Activities.Content do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset

      @primary_key false
      @derive Jason.Encoder

      def fetch(term, key) when is_atom(key) do
        {:ok, Map.get(term, key)}
      end

      def fetch(term, key) when is_binary(key) do
        {:ok, Map.get(term, String.to_existing_atom(key))}
      end
    end
  end
end
