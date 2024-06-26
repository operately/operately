defmodule Operately.Blobs.UpdateSrcDataTest do
  use Operately.DataCase

  @input %{
    "content" => [
      %{
        "content" => [%{"text" => "Hey team,", "type" => "text"}],
        "type" => "paragraph"
      },
      %{
        "content" => [
          %{
            "attrs" => %{
              "alt" => "image-1.png",
              "filesize" => 3588253,
              "filetype" => "image/png",
              "id" => "lxt8duz0yyt5lyjh6vr",
              "progress" => 100,
              "src" => %{
                "id" => "4a1ad0ef-bd9d-477e-8050-edf18df55f71",
                "url" => "/blobs/4a1ad0ef-bd9d-477e-8050-edf18df55f71"
              },
              "status" => "uploaded",
              "title" => "image-1.png"
            },
            "type" => "blob"
          }
        ],
        "type" => "paragraph"
      },
    ],
    "type" => "doc"
  }

  @expected_output %{
    "content" => [
      %{
        "content" => [%{"text" => "Hey team,", "type" => "text"}],
        "type" => "paragraph"
      },
      %{
        "content" => [
          %{
            "attrs" => %{
              "alt" => "image-1.png",
              "filesize" => 3588253,
              "filetype" => "image/png",
              "id" => "4a1ad0ef-bd9d-477e-8050-edf18df55f71",
              "progress" => 100,
              "src" => "/blobs/4a1ad0ef-bd9d-477e-8050-edf18df55f71",
              "status" => "uploaded",
              "title" => "image-1.png"
            },
            "type" => "blob"
          }
        ],
        "type" => "paragraph"
      },
    ],
    "type" => "doc"
  }

  test "succesfully converts broken blob references" do
    assert Operately.Blobs.UpdateSrcData.update(@input) == @expected_output
  end

  test "update_discussion_content" do
    input = %{
      "body" => @input,
      "title" => "Title"
    }

    expected = %{
      "body" => @expected_output,
      "title" => "Title"
    }

    assert Operately.Blobs.UpdateSrcData.update_discussion_content(input) == expected
  end
end
