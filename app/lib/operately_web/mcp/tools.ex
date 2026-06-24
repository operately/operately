defmodule OperatelyWeb.Mcp.Tools do
  alias OperatelyWeb.Mcp.Catalog.{Definition, Registry}

  def list_definitions do
    Registry.list_definitions()
  end

  def find_definition(name) when is_binary(name) do
    Registry.find_definition(name)
  end

  def list_descriptors do
    Enum.map(list_definitions(), &descriptor_for/1)
  end

  def capabilities do
    %{
      "listChanged" => false
    }
  end

  defp descriptor_for(%Definition{} = definition) do
    %{
      "name" => definition.name,
      "title" => definition.title,
      "description" => definition.description,
      "inputSchema" => definition.input_schema,
      "outputSchema" => definition.output_schema,
      "annotations" => definition.annotations,
      "_meta" => %{
        "securitySchemes" => definition.security_schemes,
        "examples" => definition.examples,
        "companyMode" => Atom.to_string(definition.company_mode),
        "requiredScopes" => definition.required_scopes,
        "safetyClassification" => Atom.to_string(definition.safety_classification),
        "discoveryMetadata" => definition.discovery_metadata
      }
    }
  end
end
