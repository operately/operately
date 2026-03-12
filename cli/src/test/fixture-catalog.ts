import type { Catalog } from "../types/catalog";

export const fixtureCatalog: Catalog = {
  schema_version: 1,
  api_base_path: "/api/external/v1",
  generated_at: "2026-01-01T00:00:00Z",
  endpoint_count: 2,
  query_count: 1,
  mutation_count: 1,
  types: {
    primitives: {
      id: { encoded_type: "string" },
    },
    objects: {
      task_status: {
        fields: [
          {
            name: "id",
            type: { kind: "named", name: "string" },
            optional: false,
            nullable: false,
            has_default: false,
            default: null,
          },
          {
            name: "label",
            type: { kind: "named", name: "string" },
            optional: false,
            nullable: false,
            has_default: false,
            default: null,
          },
        ],
      },
    },
    enums: {},
    unions: {},
  },
  endpoints: [
    {
      full_name: "edit_project_name",
      namespace: null,
      name: "edit_project_name",
      type: "mutation",
      method: "POST",
      path: "/api/external/v1/edit_project_name",
      handler: "OperatelyWeb.Api.Mutations.EditProjectName",
      inputs: [
        {
          name: "project_id",
          type: { kind: "named", name: "id" },
          optional: false,
          nullable: false,
          has_default: false,
          default: null,
        },
        {
          name: "name",
          type: { kind: "named", name: "string" },
          optional: false,
          nullable: false,
          has_default: false,
          default: null,
        },
      ],
      outputs: [],
    },
    {
      full_name: "goals/update_target_value",
      namespace: "goals",
      name: "update_target_value",
      type: "mutation",
      method: "POST",
      path: "/api/external/v1/goals/update_target_value",
      handler: "OperatelyWeb.Api.Goals.UpdateTargetValue",
      inputs: [
        {
          name: "goal_id",
          type: { kind: "named", name: "id" },
          optional: false,
          nullable: false,
          has_default: false,
          default: null,
        },
        {
          name: "target_value",
          type: { kind: "named", name: "float" },
          optional: false,
          nullable: false,
          has_default: false,
          default: null,
        },
        {
          name: "task_statuses",
          type: {
            kind: "list",
            item: { kind: "named", name: "task_status" },
          },
          optional: true,
          nullable: true,
          has_default: false,
          default: null,
        },
      ],
      outputs: [],
    },
  ],
};
