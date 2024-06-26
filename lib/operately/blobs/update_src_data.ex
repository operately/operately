defmodule Operately.Blobs.UpdateSrcData do
  @moduledoc """
  Takes a rich text as the input, looks for all the blobs, finds the ones where
  src is not a string but a map, and updates the src data with the new data.
  """

  def update_discussion_content(%{"body" => body, "title" => title}) do
    %{"body" => update(body), "title" => title}
  end

  # ---

  def update(list) when is_list(list) do
    Enum.map(list, &update/1)
  end

  def update(%{"content" => content, "type" => "doc"}) do 
    %{"content" => update(content), "type" => "doc"}
  end

  def update(%{"content" => content, "type" => "paragraph"}) do
    %{"content" => update(content), "type" => "paragraph"}
  end

  def update(%{"attrs" => attrs, "type" => "blob"}) do
    %{
      "attrs" => update_blob_attrs(attrs),
      "type" => "blob"
    }
  end

  def update(rich_content), do: rich_content

  # ---

  def update_blob_attrs(%{"src" => %{"id" => id, "url" => url}} = attrs) do
    attrs
    |> Map.put("id", id)
    |> Map.put("src", url)
  end

  def update_blob_attrs(attrs), do: attrs
    
end
