defmodule Operately.Activities.Content do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset

      @primary_key false
      @derive Jason.Encoder
      @foreign_key_type :string

      def fetch(term, key) when is_atom(key) do
        {:ok, Map.get(term, key)}
      end

      def fetch(term, key) when is_binary(key) do
        {:ok, Map.get(term, String.to_existing_atom(key))}
      end

      def cast_all_fields(attrs) do
        embeds = __schema__(:embeds)
        fields = __schema__(:fields) -- embeds

        changeset = struct(__MODULE__) |> cast(attrs, fields)

        Enum.reduce(embeds, changeset, fn embed, cs -> cast_embed(cs, embed) end)
      end
    end
  end
end
