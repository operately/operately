defmodule Operately.RichContent.ResourceLinksTest do
  use Operately.DataCase, async: true

  alias Operately.RichContent.ResourceLinks

  @origin "https://app.operately.com"
  @company "acme-0abc"

  test "URL labels ignore fragments and trailing slashes while preserving custom labels" do
    href = "#{@origin}/#{@company}/projects/website-xyz?tab=overview#comment"
    assert ResourceLinks.url_label?(href, href)
    assert ResourceLinks.url_label?(String.replace(href, "#comment", "#other"), href)
    assert ResourceLinks.url_label?("#{@origin}/#{@company}/projects/website-xyz/", href)
    assert ResourceLinks.url_label?("/#{@company}/projects/website-xyz", "/#{@company}/projects/website-xyz#comment")
    refute ResourceLinks.url_label?("Website", href)
    refute ResourceLinks.url_label?(nil, href)
  end

  test "rejects non-web schemes and accepts same-origin protocol-relative links" do
    assert :error = ResourceLinks.parse("javascript:/#{@company}/projects/website-xyz", @origin)
    assert {:ok, %{type: :project}} = ResourceLinks.parse("//app.operately.com/#{@company}/projects/website-xyz", @origin)
  end

  describe "parse/2" do
    test "extracts company, type, and id from recognized resource routes" do
      assert {:ok, %{company_id: @company, type: :project, id: "website-xyz"}} =
               ResourceLinks.parse("#{@origin}/#{@company}/projects/website-xyz", @origin)

      assert {:ok, %{type: :task, id: "ship-it"}} = ResourceLinks.parse("#{@origin}/#{@company}/tasks/ship-it", @origin)
      assert {:ok, %{type: :goal, id: "nps"}} = ResourceLinks.parse("#{@origin}/#{@company}/goals/nps", @origin)
      assert {:ok, %{type: :milestone, id: "beta"}} = ResourceLinks.parse("#{@origin}/#{@company}/milestones/beta", @origin)
      assert {:ok, %{type: :discussion, id: "launch"}} = ResourceLinks.parse("#{@origin}/#{@company}/discussions/launch", @origin)
      assert {:ok, %{type: :document, id: "abc"}} = ResourceLinks.parse("#{@origin}/#{@company}/documents/abc", @origin)
      assert {:ok, %{type: :link, id: "abc"}} = ResourceLinks.parse("#{@origin}/#{@company}/links/abc", @origin)
      assert {:ok, %{type: :file, id: "abc"}} = ResourceLinks.parse("#{@origin}/#{@company}/files/abc", @origin)
      assert {:ok, %{type: :folder, id: "abc"}} = ResourceLinks.parse("#{@origin}/#{@company}/folders/abc", @origin)
      assert {:ok, %{type: :person, id: "jane"}} = ResourceLinks.parse("#{@origin}/#{@company}/people/jane", @origin)
      assert {:ok, %{type: :space, id: "product"}} = ResourceLinks.parse("#{@origin}/#{@company}/spaces/product", @origin)
    end

    test "accepts relative paths on the current instance" do
      assert {:ok, %{company_id: @company, type: :project, id: "website-xyz"}} =
               ResourceLinks.parse("/#{@company}/projects/website-xyz", @origin)
    end

    test "extracts space kanban task ids" do
      url = "#{@origin}/#{@company}/spaces/product-space/kanban?taskId=ship-it"

      assert {:ok, %{type: :task, id: "ship-it"}} = ResourceLinks.parse(url, @origin)
    end

    test "strips fragments while keeping the resource id" do
      url = "#{@origin}/#{@company}/projects/website-xyz?tab=tasks#comment-1"

      assert {:ok, %{type: :project, id: "website-xyz"}} = ResourceLinks.parse(url, @origin)
    end

    test "rejects other origins, nested paths, and unknown resource types" do
      assert :error = ResourceLinks.parse("https://other.example/#{@company}/projects/website-xyz", @origin)
      assert :error = ResourceLinks.parse("#{@origin}/#{@company}/projects/website-xyz/pause", @origin)
      assert :error = ResourceLinks.parse("#{@origin}/#{@company}/work-map", @origin)
      assert :error = ResourceLinks.parse("https://example.com", @origin)
    end
  end
end
