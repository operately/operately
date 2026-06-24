defmodule OperatelyWeb.Mcp.Catalog.Definition do
  @type t :: %__MODULE__{
          name: String.t(),
          title: String.t(),
          description: String.t(),
          company_mode: :none | :authenticated | :resource_derived,
          safety_classification: :read_only | :write | :destructive,
          sort_order: non_neg_integer(),
          required_scopes: [String.t()],
          annotations: map(),
          security_schemes: [map()],
          examples: [map()],
          discovery_metadata: map(),
          input_schema: map(),
          output_schema: map(),
          implementation: module() | nil
        }

  defstruct [
    :name,
    :title,
    :description,
    :company_mode,
    :safety_classification,
    :implementation,
    sort_order: 0,
    required_scopes: [],
    annotations: %{},
    security_schemes: [],
    examples: [],
    discovery_metadata: %{},
    input_schema: %{},
    output_schema: %{}
  ]

  def new!(attrs) when is_list(attrs) do
    attrs
    |> Enum.into(%{})
    |> new!()
  end

  def new!(attrs) when is_map(attrs), do: struct!(__MODULE__, attrs)
end
